#target photoshop

(function () {
    var projectPath = "/Users/yaja/projects/penhu7days/public/";

    function selectSubject() {
        try {
            executeAction(stringIDToTypeID("selectSubject"), new ActionDescriptor(), DialogModes.NO);
            return true;
        } catch (e) {}
        try {
            executeAction(stringIDToTypeID("autoCutout"), new ActionDescriptor(), DialogModes.NO);
            return true;
        } catch (e) {}
        return false;
    }

    // 開啟男生圖片
    var srcFile = new File(projectPath + "hero-image-2.png");
    var doc = app.open(srcFile);

    // 轉為普通圖層
    try {
        if (doc.activeLayer.isBackgroundLayer) {
            doc.activeLayer.name = "Layer0";
        }
    } catch (e) {}

    // 選取主體
    if (!selectSubject()) {
        alert("Select Subject 失敗");
        return;
    }

    // 複製並貼上
    try { doc.selection.copy(true); } catch (e) { doc.selection.copy(); }
    var cutLayer = doc.paste();
    cutLayer.name = "SUBJECT_CUT";

    // 儲存去背版本
    var cutDoc = app.documents.add(doc.width, doc.height, doc.resolution, "ManCutout", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
    app.activeDocument = doc;
    cutLayer.duplicate(cutDoc, ElementPlacement.PLACEATBEGINNING);
    app.activeDocument = cutDoc;
    cutDoc.saveAs(new File(projectPath + "hero-man-cutout-ps.png"), new PNGSaveOptions(), true);

    // 建立最終版畫布
    var heroDoc = app.documents.add(1920, 1080, 72, "Hero-Man", NewDocumentMode.RGB, DocumentFill.WHITE);
    app.activeDocument = heroDoc;

    // 深色背景
    var darkColor = new SolidColor();
    darkColor.rgb.red = 18;
    darkColor.rgb.green = 18;
    darkColor.rgb.blue = 22;
    heroDoc.selection.selectAll();
    heroDoc.selection.fill(darkColor);
    heroDoc.selection.deselect();

    // 複製人物
    app.activeDocument = cutDoc;
    cutDoc.activeLayer.duplicate(heroDoc, ElementPlacement.PLACEATBEGINNING);

    app.activeDocument = heroDoc;
    var pLayer = heroDoc.activeLayer;
    pLayer.name = "Person";

    // 縮放
    var b = pLayer.bounds;
    var h = b[3].value - b[1].value;
    var scale = (1100 / h) * 100;
    pLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    // 移到右側
    var nb = pLayer.bounds;
    var nw = nb[2].value - nb[0].value;
    var nh = nb[3].value - nb[1].value;
    pLayer.translate(1920 - nw - 100 - nb[0].value, 1080 - nh + 100 - nb[1].value);

    // 合併並儲存
    heroDoc.flatten();
    heroDoc.saveAs(new File(projectPath + "hero-man-ps.png"), new PNGSaveOptions(), true);

    // 關閉
    doc.close(SaveOptions.DONOTSAVECHANGES);
    cutDoc.close(SaveOptions.DONOTSAVECHANGES);
    heroDoc.close(SaveOptions.DONOTSAVECHANGES);

    alert("男生圖片完成！");
})();
