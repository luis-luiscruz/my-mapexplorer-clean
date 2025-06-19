#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Linux adapter for Python Selenium scripts
Adapts Windows-specific Chrome configurations for Linux Docker environment
"""

import os
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

def get_linux_chrome_options():
    """
    Get Chrome options optimized for Linux Docker environment
    """
    options = Options()
    
    # Essential for Docker/Linux headless operation
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--remote-debugging-port=9222')
    
    # Alpine-specific Chromium optimizations
    if os.path.exists('/usr/bin/chromium-browser'):
        options.binary_location = '/usr/bin/chromium-browser'
    elif os.path.exists('/usr/bin/google-chrome'):
        options.binary_location = '/usr/bin/google-chrome'
    
    # Memory and performance optimizations
    options.add_argument('--memory-pressure-off')
    options.add_argument('--max_old_space_size=4096')
    options.add_argument('--disable-background-timer-throttling')
    options.add_argument('--disable-renderer-backgrounding')
    options.add_argument('--disable-backgrounding-occluded-windows')
    
    # Security and automation settings
    options.add_argument('--disable-web-security')
    options.add_argument('--disable-features=VizDisplayCompositor')
    options.add_argument('--disable-ipc-flooding-protection')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    # Window size for consistent rendering
    options.add_argument('--window-size=1920,1080')
    
    return options

def get_chrome_driver(options=None):
    """
    Get Chrome WebDriver configured for Linux environment
    """
    if options is None:
        options = get_linux_chrome_options()
    
    # Use system Chrome instead of ChromeDriverManager in Docker
    # The selenium/standalone-chrome image has Chrome pre-installed
    try:
        # Try to use system chromedriver first
        driver = webdriver.Chrome(options=options)
        return driver
    except Exception as e:
        print(f"[ERROR] Failed to initialize Chrome driver: {e}")
        # Fallback to remote WebDriver if available
        try:
            from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
            driver = webdriver.Remote(
                command_executor='http://localhost:4444/wd/hub',
                desired_capabilities=DesiredCapabilities.CHROME,
                options=options
            )
            return driver
        except Exception as e2:
            print(f"[ERROR] Failed to connect to remote WebDriver: {e2}")
            raise e

def patch_webdriver_for_linux():
    """
    Monkey patch to replace Windows webdriver initialization with Linux version
    """
    import selenium.webdriver as wd
    
    # Store original Chrome class
    original_chrome = wd.Chrome
    
    def linux_chrome(*args, **kwargs):
        # Override options with Linux-compatible ones
        linux_opts = get_linux_chrome_options()
        
        if 'options' in kwargs:
            # Merge user options with Linux options
            user_opts = kwargs['options']
            for arg in user_opts.arguments:
                if arg not in linux_opts.arguments:
                    linux_opts.add_argument(arg)
        
        kwargs['options'] = linux_opts
        
        # Remove service parameter if it uses ChromeDriverManager
        if 'service' in kwargs:
            service = kwargs['service']
            # Check if it's using ChromeDriverManager
            if hasattr(service, 'path') and 'chromedriver' in str(service.path):
                del kwargs['service']
        
        return original_chrome(**kwargs)
    
    # Replace the Chrome class
    wd.Chrome = linux_chrome

if __name__ == "__main__":
    # Test the adapter
    print("[INFO] Testing Linux Chrome adapter...")
    try:
        driver = get_chrome_driver()
        driver.get("https://www.google.com")
        print(f"[SUCCESS] Chrome driver working. Title: {driver.title}")
        driver.quit()
    except Exception as e:
        print(f"[ERROR] Chrome driver test failed: {e}")
        sys.exit(1)
