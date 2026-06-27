Add-Type -AssemblyName System.Windows.Forms
$f = New-Object System.Windows.Forms.FolderBrowserDialog
$f.Description = "Select Template Folder containing Video1 and TitleCard"
$f.ShowNewFolderButton = $false
$r = $f.ShowDialog()
if ($r -eq "OK") {
    Write-Output $f.SelectedPath
}
