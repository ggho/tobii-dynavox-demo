//-----------------------------------------------------------------------
// Copyright 2014 Tobii Technology AB. All rights reserved.
//-----------------------------------------------------------------------


namespace UserPresenceWpf
{
    using System.Windows;
    using System;


    using Tobii.EyeX.Framework;
    using Tobii.EyeX.Client;
    using Awesomium.Core;
    using Awesomium.Windows.Controls;
    using System.IO;

    using System.Diagnostics;
    using System.ComponentModel;

    using System.Runtime.InteropServices;



    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        [DllImport("user32.dll")]
        static extern bool SetForegroundWindow(IntPtr hWnd);


        public MainWindow()
        {
            InitializeComponent();

            DataContextChanged += OnDataContextChanged;
            Loaded += OnLoaded;

            //ActivateApp("iexplore");

            

        }

        private void OnDataContextChanged(object sender, DependencyPropertyChangedEventArgs e)
        {
            ((MainWindowModel)DataContext).PropertyChanged += OnPropertyChanged;
        }

        private void OnLoaded(object sender, RoutedEventArgs e)
        {
            WebControl.Source = new Uri(new FileInfo(@"html/index.html").FullName);
            //webControl.Source = new Uri(new FileInfo(@"Tobii.EyeX.Web/samples/Demos/JSDemo2.html").FullName);

            //// porting web console to native console
            WebControl.ConsoleMessage += (sender1, args) => Console.Out.WriteLine("[JS]{1}:{2} {0}", args.Message, args.Source, args.LineNumber);
            WebControl.ShowContextMenu += (sender1, args) => args.Handled = true;


            //WebControl.DocumentReady += (sender1, arg) => WebControl.ExecuteJavascript(string.Format("alert('Gigi says hi');"));

            
            using (JSObject webApp = WebControl.CreateGlobalJavascriptObject("native")) //create under window object, i.e. window.native
            {

                webApp.BindAsync("TestFunc", (sender1, args) =>
                {
                    //TechFunc callback
                    Console.Out.WriteLine((string)args.Arguments[0]);

                    WebControl.ExecuteJavascript(string.Format("alert({0});", "Gigi is calling"));


                    //Execute.OnUIThreadAsync(() => _web.ExecuteJavascript(string.Format("mymethod({0});", 60)));
                });
            }

        }

        private void OnPropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            MainWindowModel model = (MainWindowModel)DataContext;
            //Console.WriteLine("A property has changed: " + e.PropertyName);
            if (e.PropertyName == "IsUserDelayedPresent" && model.IsUserDelayedPresent)
            {
                Console.WriteLine("Before: Eyetracking mode:" + model.EyeXHost.EyeTrackingDeviceStatus);

                model.EyeXHost.LaunchGuestCalibration(model.CalibrationHandler);

                model.CancelDelayedTask();

                Console.WriteLine("After: Eyetracking mode:" + model.EyeXHost.EyeTrackingDeviceStatus);
            }
            else if (e.PropertyName == "FixationPoint")
            {
                //Point fixationPoint = model.CurFixationPoint;
                Point clientCorrdinate = WebControl.PointFromScreen(model.FixationPoint);

                //forward point to wecControl
                if(WebControl.IsDocumentReady){
                    WebControl.ExecuteJavascript(string.Format("GlobalFunc({0}, {1});", clientCorrdinate.X, clientCorrdinate.Y));
                }

            }
        }


        private void ActivateApp(string processName)
        {
            //test get other process
            //Process[] localAll = Process.GetProcesses();
            Process[] processes = Process.GetProcessesByName(processName);

            // Activate the first application we find with this name

            foreach (Process p in processes)
            {
                if (p.MainWindowTitle != "")
                    SetForegroundWindow(p.MainWindowHandle);
            }

        }
    }
}
