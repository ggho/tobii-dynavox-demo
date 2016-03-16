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
        public MainWindow()
        {
            InitializeComponent();

            DataContextChanged += OnDataContextChanged;
            Loaded += OnLoaded;

            //ActivateApp("iexplore");
        }

        private void OnDataContextChanged(object sender, DependencyPropertyChangedEventArgs e)
        {
            //((MainWindowModel)DataContext).PropertyChanged += OnPropertyChanged;
        }

        private void OnLoaded(object sender, RoutedEventArgs e)
        {
            MainWindowModel model = (MainWindowModel)DataContext;
            model.InitWebControl(WebControl, @"html/index.html");
        }

        private void OnPropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            MainWindowModel model = (MainWindowModel)DataContext;
            if (e.PropertyName == "IsUserDelayedPresent" && model.IsUserDelayedPresent)
            {
     
            }
        }

    }
}
