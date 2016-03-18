//-----------------------------------------------------------------------
// Copyright 2014 Tobii Technology AB. All rights reserved.
//-----------------------------------------------------------------------

namespace UserPresenceWpf
{
    using System;
    using System.ComponentModel;
    using System.Windows;
    using EyeXFramework;
    using EyeXFramework.Wpf;
    using Tobii.EyeX.Framework;
    using Tobii.EyeX.Client;

    using Awesomium.Core;
    using Awesomium.Windows.Controls;
    using System.IO;

    using System.Threading;
    using System.Threading.Tasks;

    using System.Web.Script.Serialization; //for JSON serialization

    /// <summary>
    /// The MainWindowModel retrieves the UserPresence state from the WpfEyeXHost,
    /// and sets up a listener for changes to the state. It exposes a property
    /// ImageSource, which changes depending on the UserPresence state.
    /// </summary>
    public class MainWindowModel : INotifyPropertyChanged, IDisposable
    {
        public enum AppStates
        {
            Idle = 1,
            Attentive = 2,
            Positioning = 3,
            Calibration = 4,
            GameExplore = 5,
            GameTarget = 6
        }
        public struct BothEyePosition
        {
            public EyePosition Left;
            public EyePosition Right;
        }

        private readonly WpfEyeXHost _eyeXHost;
        private string _imageSource;
        private bool _isUserPresent;
        private bool _isUserDelayedPresent;
        private CancellationTokenSource _delayedTaskTokenSource; 

        private bool _isTrackingGaze;
        private bool _isTrackingGazeSupported;

        private AsyncData _calibrationAsyncData;
        private bool _isCalibrating;

        private Point _fixationPoint;
        private EyePosition _leftEyePositionNormalized;
        private EyePosition _rightEyePositionNormalized;

        private AppStates _appState;
        private WebControl _web;

        private JavaScriptSerializer _serializer;

        public MainWindowModel()
        {
            IsUserPresent = false;
            IsTrackingGaze = false;
            IsTrackingGazeSupported = true;

            IsUserDelayedPresent = false;
            _isCalibrating = false;

            AppState = AppStates.Idle;


            _serializer = new JavaScriptSerializer();

            // Create and start the WpfEyeXHost. Starting the host means
            // that it will connect to the EyeX Engine and be ready to 
            // start receiving events and get the current values of
            // different engine states. In this sample we will be using
            // the UserPresence engine state.
            _eyeXHost = new WpfEyeXHost();

            // Register an status-changed event listener for UserPresence.
            // NOTE that the event listener must be unregistered too. This is taken care of in the Dispose(bool) method.
            _eyeXHost.UserPresenceChanged += EyeXHost_UserPresenceChanged;
            _eyeXHost.GazeTrackingChanged += EyeXHost_GazeTrackingChanged;
            _eyeXHost.EyeTrackingDeviceStatusChanged += EyeXHost_EyeTrackingDeviceStatusChanged;


            // streams
            _eyeXHost.CreateFixationDataStream(FixationDataMode.Slow).Next += EyeXHost_FixationDataStream;
            _eyeXHost.CreateEyePositionDataStream().Next += EyeXHost_EyePositionDataStream;
                   

            // Start the EyeX host.
            _eyeXHost.Start();

            // Wait until we're connected.
            if (_eyeXHost.WaitUntilConnected(TimeSpan.FromSeconds(5)))
            {
                // Make sure the EyeX Engine version is equal to or greater than 1.4.
                var engineVersion = _eyeXHost.GetEngineVersion().Result;
                if (engineVersion.Major != 1 || engineVersion.Major == 1 && engineVersion.Minor < 4)
                {
                    IsTrackingGazeSupported = false;
                }
            }
        }

        public event PropertyChangedEventHandler PropertyChanged;

        /// <summary>
        /// A path to an image corresponding to the current UserPresence state.
        /// </summary>
        public string ImageSource
        {
            get { return _imageSource; }
        }

        /// <summary>
        /// Gets whether or not the user is present.
        /// </summary>
        public bool IsUserPresent
        {
            get { return _isUserPresent; }
            private set
            {
                if (_isUserPresent == value)
                    return;

                _isUserPresent = value;
                _imageSource = _isUserPresent
                    ? "/Images/present.png"
                    : "/Images/not-present.png";

                // Notify of properties that have changed.
                OnPropertyChanged("IsUserPresent");
                OnPropertyChanged("ImageSource");
            }
        }

        /// <summary>
        /// Gets whether or not the user is present.
        /// </summary>
        public bool IsUserDelayedPresent
        {
            get { return _isUserDelayedPresent; }
            private set
            {
                //maybe not?
                //if (_isUserDelayedPresent == value)
                    //return;

                _isUserDelayedPresent = value;


                if (_isUserDelayedPresent)
                {
                    if (AppState < AppStates.Positioning)
                        AppState = AppState + 1;
                }
                else
                {
                    AppState = AppStates.Idle;
                }

                OnPropertyChanged("IsUserDelayedPresent");
            }
        }

        public void CancelDelayedTask()
        {
            _delayedTaskTokenSource.Cancel();
            //_delayedTaskTokenSource.Dispose();  

            //TODO: also handle non-cancel disposal
        }


        public void CalibrationHandler(AsyncData asyncData)
        {
            Console.WriteLine("Calibration handler");
            _calibrationAsyncData = asyncData; //this async data doesn't seem to tell anything

            _isCalibrating = true;
        }

        /// <summary>
        /// Gets whether or not gaze is being tracked.
        /// </summary>
        public bool IsTrackingGaze
        {
            get { return _isTrackingGaze; }
            private set
            {
                _isTrackingGaze = value;
                OnPropertyChanged("IsTrackingGaze");
            }
        }

        public bool IsTrackingGazeSupported
        {
            get { return _isTrackingGazeSupported; }
            set
            {
                _isTrackingGazeSupported = value;
                OnPropertyChanged("IsTrackingGazeSupported");
                OnPropertyChanged("IsTrackingGazeNotSupported");
            }
        }

        public bool IsTrackingGazeNotSupported
        {
            get { return !IsTrackingGazeSupported; }
        }

        public Point FixationPoint
        {
            get { return _fixationPoint; }
            set
            {
                _fixationPoint = value;

                //forward point to wecControl during Game states
                if (AppState == AppStates.GameExplore || AppState == AppStates.GameTarget)
                {
                    Point clientCorrdinate = _web.PointFromScreen(_fixationPoint);
                    CallWeb("fixationPoint", new { x = clientCorrdinate.X, y = clientCorrdinate.Y });
                }

                OnPropertyChanged("FixationPoint");
            }
        }

        public EyePosition LeftEyePositionNormalized
        {
            get { return _leftEyePositionNormalized; }
            set
            {
                _leftEyePositionNormalized = value;
            }
        }

        public EyePosition RightEyePositionNormalized
        {
            get { return _rightEyePositionNormalized; }
            set
            {
                _rightEyePositionNormalized = value;
            }
        }

        public EyePosition CombinedEyePositionNormalized
        {
            get
            {
                //if both left and right are valid , return middle point
                //else return either valid one
                //else return null
                return null;
            }
        }

        public AppStates AppState
        {
            get { return _appState; }
            set
            {
                if (value == _appState)
                    return;

                _appState = value;
                CallWeb("setState", new { state = _appState });

                if (_appState == AppStates.Attentive){
                    //ensure user presense for x more seconds then move on to next state
                    SetDelayedUserPresentAsync(true); 
                }
                else if (_appState == AppStates.Positioning)
                {
                    //wait for Web callback of positioning done

                    //otherwise: do a backup plan to force to calibration (e.g. 30s timeout)
                    Task.Delay(20000).ContinueWith(_ => 
                    {
                        RunOnMainThread(() =>
                        {
                            if (AppState < AppStates.Calibration && AppState != AppStates.Idle)
                                AppState = AppStates.Calibration;
                        });
                    });
                }
                else if (_appState == AppStates.Calibration)
                {
                    _eyeXHost.LaunchGuestCalibration(CalibrationHandler);
                    CancelDelayedTask();

                    //move on next state (or wait 2s?)
                    AppState = AppStates.GameExplore;
                }
                else if (_appState == AppStates.GameExplore)
                {
                    Task.Delay(30000).ContinueWith(_ => 
                    {
                        RunOnMainThread(() =>
                        {
                            if (AppState == AppStates.GameExplore)
                                AppState = AppStates.GameTarget;
                        });
                    });
                }

                
                OnPropertyChanged("AppState");
            }
        }

        public void InitWebControl(WebControl wc, string filepath)
        {
            // Setup web control
            _web = wc;
            _web.Source = new Uri(new FileInfo(filepath).FullName);

            // porting web console to native console
            _web.ConsoleMessage += (sender1, args) => Console.Out.WriteLine("[JS]{1}:{2} {0}", args.Message, args.Source, args.LineNumber);
            _web.ShowContextMenu += (sender1, args) => args.Handled = true;

            //WebControl.DocumentReady += (sender1, arg) => WebControl.ExecuteJavascript(string.Format("alert('Gigi says hi');"));

            //Register global function to be called by Web
            using (JSObject webApp = _web.CreateGlobalJavascriptObject("native")) //create native object in WebApp global scope, i.e. window.native
            {
                webApp.BindAsync("callNative", (sender1, args) =>
                {
                    Console.Out.WriteLine((string)args.Arguments[0]);

                    //_web.ExecuteJavascript(string.Format("alert({0});", "Gigi is calling"));
                    //Execute.OnUIThreadAsync(() => _web.ExecuteJavascript(string.Format("mymethod({0});", 60)));
                });
            }
        }

        public void CallWeb(string eventName, object data)
        {
            if (_web != null && _web.IsDocumentReady)
            {
                var jsonData = _serializer.Serialize(data);
                _web.ExecuteJavascript(string.Format("callWeb('" + eventName + "', {0});", jsonData));
            }
        }

        /// <summary>
        /// Cleans up any resources being used.
        /// </summary>
        public void Dispose()
        {
            _eyeXHost.UserPresenceChanged -= EyeXHost_UserPresenceChanged;
            _eyeXHost.GazeTrackingChanged -= EyeXHost_GazeTrackingChanged;

            _eyeXHost.EyeTrackingDeviceStatusChanged -= EyeXHost_EyeTrackingDeviceStatusChanged;
            
            _eyeXHost.Dispose();

            _delayedTaskTokenSource.Dispose();
        }

        private void EyeXHost_UserPresenceChanged(object sender, EngineStateValue<UserPresence> value)
        {
            //ignore any user presence change during calibration
            if (_isCalibrating)
                return;

            //!!With the above checking, below isn't necesary
            //check state and see if in calibration, then ignore this event
            //EngineStateValue<EyeTrackingDeviceStatus> deviceState = _eyeXHost.EyeTrackingDeviceStatus;
            //if (deviceState.IsValid && (deviceState.Value == EyeTrackingDeviceStatus.Configuring || deviceState.Value == EyeTrackingDeviceStatus.Initializing))
            //    return;

            bool isUserPresent = value.IsValid && value.Value == UserPresence.Present;

            //add delay , only call when present for 2s
            
            SetDelayedUserPresentAsync(isUserPresent);

            // State-changed events are received on a background thread.
            // But operations that affect the GUI must be executed on the main thread.
            RunOnMainThread(() =>
            {
                Console.WriteLine("User Presenence changed: " + value.IsValid + " " + value.Value);
                IsUserPresent = isUserPresent;
            });
        }

        async Task SetDelayedUserPresentAsync(bool isPresent)
        {
            int delayMs = isPresent ? 2000 : 5000;
            _delayedTaskTokenSource = new CancellationTokenSource();  

            try
            {
                await Task.Delay(delayMs, _delayedTaskTokenSource.Token);
                //if UserPresence stays the same after x sec, then set it 
                if (IsUserPresent == isPresent)
                {
                    RunOnMainThread(() =>
                    {
                        Console.WriteLine("Delayed User Presenence changed: " + isPresent);
                        IsUserDelayedPresent = isPresent;
                    });
                }
            }
            catch (TaskCanceledException ex)
            {
                Console.WriteLine(ex.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }

            
        }

        private void EyeXHost_GazeTrackingChanged(object sender, EngineStateValue<GazeTracking> value)
        {
            // State-changed events are received on a background thread.
            // But operations that affect the GUI must be executed on the main thread.
            RunOnMainThread(() =>
            {
                IsTrackingGaze = value.IsValid && value.Value == GazeTracking.GazeTracked;
            });
        }

        private void EyeXHost_EyeTrackingDeviceStatusChanged(object sender, EngineStateValue<EyeTrackingDeviceStatus> value)
        {
            Console.WriteLine(" Tracking Status changed: " + value.IsValid + " " + value.Value);
            //TEMP workaround to track when calibrating is done: first 'tracking' state deflags calibrating state
            if (_isCalibrating && value.IsValid && value.Value == EyeTrackingDeviceStatus.Tracking)
            {
                _isCalibrating = false;
                //Console.WriteLine(_calibrationAsyncData);
            }
        }
        
        
        private void EyeXHost_FixationDataStream(object sender, FixationEventArgs args)
        {
            Point fixationPoint = new Point(args.X, args.Y);
            RunOnMainThread(() =>
            {
                FixationPoint = fixationPoint;
            });
        }

        private void EyeXHost_EyePositionDataStream(object sender, EyePositionEventArgs args)
        {

            RunOnMainThread(() =>
            {
                LeftEyePositionNormalized = args.LeftEyeNormalized;
                RightEyePositionNormalized = args.RightEyeNormalized;
                
            });
        }

        private void OnPropertyChanged(string name)
        {
            var handler = PropertyChanged;
            if (handler != null)
            {
                handler(this, new PropertyChangedEventArgs(name));
            }
        }

        /// <summary>
        /// Marshals the given operation to the UI thread.
        /// </summary>
        /// <param name="action">The operation to be performed.</param>
        private static void RunOnMainThread(Action action)
        {
            if (Application.Current != null)
            {
                Application.Current.Dispatcher.BeginInvoke(action);
            }
        }
    }
}
