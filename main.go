package main

import (
"embed"

"github.com/wailsapp/wails/v2"
"github.com/wailsapp/wails/v2/pkg/options"
"github.com/wailsapp/wails/v2/pkg/options/assetserver"
"github.com/wailsapp/wails/v2/pkg/options/mac"
"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
app := NewApp()

err := wails.Run(&options.App{
Title:            "ZentraDeck",
Width:            1280,
Height:           820,
MinWidth:         980,
MinHeight:        640,
BackgroundColour: &options.RGBA{R: 9, G: 13, B: 22, A: 255},
AssetServer: &assetserver.Options{
Assets: assets,
},
OnStartup:     app.startup,
OnBeforeClose: app.beforeClose,
OnShutdown:    app.shutdown,
Bind: []interface{}{
app,
},
Windows: &windows.Options{
Theme: windows.Dark,
},
Mac: &mac.Options{
Appearance: mac.NSAppearanceNameDarkAqua,
},
})

if err != nil {
println("Error:", err.Error())
}
}