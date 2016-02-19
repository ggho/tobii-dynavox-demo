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

            //webControl.Source = new Uri(new FileInfo(@"html/sensory-game/sensory-game.html").FullName);
            //webControl.Source = new Uri(new FileInfo(@"Tobii.EyeX.Web/samples/Demos/JSDemo2.html").FullName);

            //// porting web console to native console
            //webControl.ConsoleMessage += (sender1, args) => Console.Out.WriteLine("[JS]{1}:{2} {0}", args.Message, args.Source, args.LineNumber);
            //webControl.ShowContextMenu += (sender1, args) => args.Handled = true;

            ActivateApp("iexplore");
        }

        protected override void OnActivated(EventArgs e)
        {
            ((MainWindowModel)DataContext).PropertyChanged += OnPropertyChanged;
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

                //ActivateApp("iexplore");
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
