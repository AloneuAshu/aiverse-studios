Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create a hidden owner form so the dialog appears in the foreground
$owner = New-Object System.Windows.Forms.Form
$owner.TopMost = $true
$owner.StartPosition = 'Manual'
$owner.Location = New-Object System.Drawing.Point(-32000, -32000)
$owner.Size = New-Object System.Drawing.Size(1, 1)
$owner.Show()
$owner.BringToFront()

$f = New-Object System.Windows.Forms.FolderBrowserDialog
$f.Description = "Select Template Folder containing Video1 and TitleCard"
$f.ShowNewFolderButton = $false
$f.RootFolder = "MyComputer"

$r = $f.ShowDialog($owner)
$owner.Dispose()

if ($r -eq "OK") {
    Write-Output $f.SelectedPath
}
