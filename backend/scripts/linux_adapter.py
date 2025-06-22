#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Linux Adapter for Selenium WebDriver in Docker environments
This module provides compatibility functions for running Selenium in Docker containers
"""

import os
import sys
from selenium.webdriver.chrome.options import Options


def patch_webdriver_for_linux():
    """
    Apply patches and configurations for Linux/Docker environment
    """
    print("[LINUX_ADAPTER] Applying Linux/Docker patches...")
    
    # Set environment variables for Chrome in Docker
    os.environ['CHROME_BIN'] = '/usr/bin/google-chrome'
    os.environ['CHROMEDRIVER_PATH'] = '/usr/local/bin/chromedriver'
    
    # Disable GPU and sandbox for Docker
    os.environ['CHROME_NO_SANDBOX'] = '1'
    os.environ['CHROME_DISABLE_GPU'] = '1'
    
    print("[LINUX_ADAPTER] Environment variables set:")
    print(f"  CHROME_BIN: {os.environ.get('CHROME_BIN')}")
    print(f"  CHROMEDRIVER_PATH: {os.environ.get('CHROMEDRIVER_PATH')}")


def get_linux_chrome_options():
    """
    Get optimized Chrome options for Linux/Docker environment
    """
    options = Options()
    
    # Essential options for Docker environment
    options.add_argument('--headless=new')  # Use new headless mode
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--disable-web-security')
    options.add_argument('--disable-features=VizDisplayCompositor')
    options.add_argument('--disable-extensions')
    options.add_argument('--disable-plugins')
    options.add_argument('--disable-images')
    options.add_argument('--disable-javascript')  # Can be removed if JS is needed
    options.add_argument('--no-first-run')
    options.add_argument('--disable-default-apps')
    options.add_argument('--disable-infobars')
    options.add_argument('--disable-notifications')
    options.add_argument('--disable-popup-blocking')
    
    # Memory and performance optimizations
    options.add_argument('--memory-pressure-off')
    options.add_argument('--max_old_space_size=4096')
    options.add_argument('--single-process')
    
    # Window size for headless mode
    options.add_argument('--window-size=1920,1080')
    
    # User agent to avoid detection
    options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    # Disable automation detection
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    # Additional Docker-specific options
    options.add_argument('--remote-debugging-port=9222')
    options.add_argument('--disable-background-timer-throttling')
    options.add_argument('--disable-backgrounding-occluded-windows')
    options.add_argument('--disable-renderer-backgrounding')
    
    print("[LINUX_ADAPTER] Chrome options configured for Docker environment")
    return options


def verify_chrome_installation():
    """
    Verify that Chrome and ChromeDriver are properly installed
    """
    import subprocess
    
    try:
        # Check Chrome
        chrome_version = subprocess.check_output(['google-chrome', '--version'], 
                                               stderr=subprocess.STDOUT, 
                                               universal_newlines=True).strip()
        print(f"[LINUX_ADAPTER] Chrome found: {chrome_version}")
        
        # Check ChromeDriver
        driver_version = subprocess.check_output(['chromedriver', '--version'], 
                                               stderr=subprocess.STDOUT, 
                                               universal_newlines=True).strip()
        print(f"[LINUX_ADAPTER] ChromeDriver found: {driver_version}")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"[LINUX_ADAPTER] Installation check failed: {e}")
        return False
    except FileNotFoundError as e:
        print(f"[LINUX_ADAPTER] Binary not found: {e}")
        return False


def get_chrome_binary_path():
    """
    Get the path to Chrome binary
    """
    possible_paths = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            print(f"[LINUX_ADAPTER] Chrome binary found at: {path}")
            return path
    
    print("[LINUX_ADAPTER] Chrome binary not found in standard locations")
    return None


def get_chromedriver_path():
    """
    Get the path to ChromeDriver binary
    """
    possible_paths = [
        '/usr/local/bin/chromedriver',
        '/usr/bin/chromedriver',
        '/opt/chromedriver/chromedriver'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            print(f"[LINUX_ADAPTER] ChromeDriver found at: {path}")
            return path
    
    print("[LINUX_ADAPTER] ChromeDriver not found in standard locations")
    return None


if __name__ == "__main__":
    # Test the adapter
    print("Testing Linux Adapter...")
    patch_webdriver_for_linux()
    verify_chrome_installation()
    options = get_linux_chrome_options()
    print(f"Generated {len(options.arguments)} Chrome arguments")
