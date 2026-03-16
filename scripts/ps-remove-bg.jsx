// 使用 Remove Background 功能
#target photoshop

var projectPath = "/Users/yaja/projects/penhu7days/public/";

// 開啟女生圖片
var womanFile = new File(projectPath + "hero-image.png");
var doc = app.open(womanFile);

// 轉換背景圖層為普通圖層
try {
    var layer = doc.backgroundLayer;
    layer.name = "Original";
} catch(e) {
    // 已經是普通圖層
}

// 嘗試使用 Remove Background (Photoshop 2021+)
try {
    var idRemoveBackground = stringIDToTypeID("removeBackground");
    executeAction(idRemoveBackground, undefined, DialogModes.NO);
    alert("背景移除成功！");
} catch(e) {
    // 如果 Remove Background 不行，試試 Neural Filters 方法
    alert("Remove Background 失敗: " + e + "\n\n將嘗試其他方法...");

    // 試試 Magic Wand 選取背景色然後反選
    try {
        // 用魔術棒選取左上角背景
        var idsetd = charIDToTypeID("setd");
        var desc1 = new ActionDescriptor();
        var idnull = charIDToTypeID("null");
        var ref1 = new ActionReference();
        ref1.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
        desc1.putReference(idnull, ref1);
        var idT = charIDToTypeID("T   ");
        var desc2 = new ActionDescriptor();
        desc2.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 10);
        desc2.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 10);
        desc1.putObject(idT, charIDToTypeID("Pnt "), desc2);
        desc1.putInteger(charIDToTypeID("Tlrn"), 32);
        desc1.putBoolean(charIDToTypeID("AntA"), true);
        executeAction(idsetd, desc1, DialogModes.NO);

        // 擴展選區
        doc.selection.expand(new UnitValue(1, "px"));

        // 反選
        doc.selection.invert();

        // 羽化
        doc.selection.feather(new UnitValue(1, "px"));

        alert("已用魔術棒選取人物！\n請檢查選區是否正確。");
    } catch(e2) {
        alert("所有自動方法都失敗了: " + e2);
    }
}
