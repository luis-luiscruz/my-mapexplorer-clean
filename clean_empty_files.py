import os
import sys

def find_empty_files(directory):
    """Find all empty files in the given directory and its subdirectories."""
    empty_files = []
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and .git directories
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
            
        for file in files:
            filepath = os.path.join(root, file)
            try:
                if os.path.isfile(filepath) and os.path.getsize(filepath) == 0:
                    empty_files.append(filepath)
            except Exception as e:
                print(f"Error checking file {filepath}: {e}")
    
    return empty_files

def remove_files(files, dry_run=True):
    """Remove the specified files. If dry_run is True, just print what would be removed."""
    for file in files:
        if dry_run:
            print(f"Would remove: {file}")
        else:
            try:
                os.remove(file)
                print(f"Removed: {file}")
            except Exception as e:
                print(f"Error removing {file}: {e}")

def main():
    # Use the current directory by default
    directory = os.getcwd()
    
    # Check if a directory was provided as a command-line argument
    if len(sys.argv) > 1:
        directory = sys.argv[1]
    
    # Default to dry run (safe mode)
    dry_run = True
    
    # Check if --remove flag was provided
    if len(sys.argv) > 2 and sys.argv[2] == '--remove':
        dry_run = False
    
    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return
    
    print(f"Scanning directory: {directory}")
    empty_files = find_empty_files(directory)
    
    if not empty_files:
        print("No empty files found.")
        return
    
    print(f"Found {len(empty_files)} empty files:")
    remove_files(empty_files, dry_run)
    
    if dry_run:
        print("\nThis was a dry run. No files were actually removed.")
        print("To remove the files, run the script with the --remove flag:")
        print(f"python {os.path.basename(__file__)} \"{directory}\" --remove")

if __name__ == "__main__":
    main()
