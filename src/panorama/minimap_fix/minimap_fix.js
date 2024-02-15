var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

(function () {
    DotaHUD.Get().FindChildTraverse("minimap").style.visibility = "collapse";
    $("#Map").maptexture = "materials/overviews/mountain_new_tga_70e8558c.vtex"
})();