Add-Type -AssemblyName System.Windows.Forms
$f = New-Object System.Windows.Forms.OpenFileDialog
$f.Filter = "Media Files (*.mp4;*.mkv;*.avi;*.mp3;*.wav)|*.mp4;*.mkv;*.avi;*.mp3;*.wav|All Files (*.*)|*.*"
$f.Title = "Select AIVERSE Media Source"
$r = $f.ShowDialog()
if ($r -eq "OK") {
    Write-Output $f.FileName
}
