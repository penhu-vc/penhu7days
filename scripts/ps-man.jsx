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

    try { doc.backgroundLayer.name = "Original"; } catch (e) {}

    if (!selectSubject()) {
        alert("Select Subject 失敗");
        return;
    }

    try { doc.selection.copy(true); } catch (e) { doc.selection.copy(); }
    var cutLayer = doc.paste();
    cutLayer.name = "SUBJECT_CUT";
    doc.layers.getByName("Original").visible = false;

    // 建立新畫布 - 深色背景
    var heroDoc = app.documents.add(1920, 1080, 72, "Hero-Man", NewDocumentMode.RGB, DocumentFill.WHITE);
    app.activeDocument = heroDoc;

    var bgLayer = heroDoc.activeLayer;
    bgLayer.name = "BG";

    // 深色背景
    var darkColor = new SolidColor();
    darkColor.rgb.red = 20;
    darkColor.rgb.green = 20;
    darkColor.rgb.blue = 25;

    heroDoc.selection.selectAll();
    heroDoc.selection.fill(darkColor);
    heroDoc.selection.deselect();

    // 複製人物
    app.activeDocument = doc;
    cutLayer.duplicate(heroDoc, ElementPlacement.PLACEATBEGINNING);

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
    var moveX = 1920 - nw - 100 - nb[0].value;
    var moveY = 1080 - nh + 100 - nb[1].value;
    pLayer.translate(moveX, moveY);

    // 合併並儲存
    heroDoc.flatten();
    var saveFile = new File(projectPath + "hero-man-ps.png");
    heroDoc.saveAs(saveFile, new PNGSaveOptions(), true);

    doc.close(SaveOptions.DONOTSAVECHANGES);
    heroDoc.close(SaveOptions.DONOTSAVECHANGES);

    alert("男生圖片完成！\n" + saveFile.fsName);
})();
