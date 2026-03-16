#target photoshop

(function () {
    var projectPath = "/Users/yaja/projects/penhu7days/public/";

    function runSelectSubject() {
        try {
            executeAction(stringIDToTypeID("selectSubject"), new ActionDescriptor(), DialogModes.NO);
            return true;
        } catch (e1) {}
        try {
            executeAction(stringIDToTypeID("autoCutout"), new ActionDescriptor(), DialogModes.NO);
            return true;
        } catch (e2) {}
        return false;
    }

    // ===== 處理女生 =====
    function processWoman() {
        var srcFile = new File(projectPath + "hero-image.png");
        var doc = app.open(srcFile);

        try { doc.backgroundLayer.name = "Original"; } catch (e) {}
        try { doc.selection.deselect(); } catch (e) {}

        if (!runSelectSubject()) {
            alert("Select Subject 失敗");
            return false;
        }

        try { doc.selection.copy(true); } catch (e) { doc.selection.copy(); }
        var cutLayer = doc.paste();
        cutLayer.name = "SUBJECT_CUT";
        try { doc.selection.deselect(); } catch (e) {}

        // 建立新畫布 1920x1080
        var heroDoc = app.documents.add(1920, 1080, 72, "Hero-Woman", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

        // 漸變背景
        var bgLayer = heroDoc.artLayers.add();
        bgLayer.name = "BG";
        heroDoc.selection.selectAll();
        var c1 = new SolidColor(); c1.rgb.red = 210; c1.rgb.green = 178; c1.rgb.blue = 148;
        var c2 = new SolidColor(); c2.rgb.red = 168; c2.rgb.green = 143; c2.rgb.blue = 118;
        app.foregroundColor = c1;
        app.backgroundColor = c2;

        var idGrdn = charIDToTypeID("Grdn");
        var desc = new ActionDescriptor();
        var descFrom = new ActionDescriptor();
        descFrom.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0);
        descFrom.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 0);
        desc.putObject(charIDToTypeID("From"), charIDToTypeID("Pnt "), descFrom);
        var descTo = new ActionDescriptor();
        descTo.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0);
        descTo.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 1080);
        desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Pnt "), descTo);
        desc.putEnumerated(charIDToTypeID("Type"), charIDToTypeID("GrdT"), charIDToTypeID("Lnr "));
        executeAction(idGrdn, desc, DialogModes.NO);
        heroDoc.selection.deselect();

        // 光暈
        var glowLayer = heroDoc.artLayers.add();
        glowLayer.name = "Glow";
        heroDoc.selection.select([[1000,100],[1900,100],[1900,980],[1000,980]]);
        heroDoc.selection.feather(new UnitValue(180, "px"));
        var glowC = new SolidColor(); glowC.rgb.red = 255; glowC.rgb.green = 232; glowC.rgb.blue = 205;
        heroDoc.selection.fill(glowC);
        glowLayer.opacity = 50;
        heroDoc.selection.deselect();

        // 複製人物到新畫布
        app.activeDocument = doc;
        cutLayer.duplicate(heroDoc, ElementPlacement.PLACEATBEGINNING);

        app.activeDocument = heroDoc;
        var pLayer = heroDoc.activeLayer;

        // 縮放
        var b = pLayer.bounds;
        var h = b[3].value - b[1].value;
        var scale = (1060 / h) * 100;
        pLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

        // 移到右側
        var nb = pLayer.bounds;
        var nw = nb[2].value - nb[0].value;
        var nh = nb[3].value - nb[1].value;
        pLayer.translate(1920 - nw - 30 - nb[0].value, 1080 - nh + 10 - nb[1].value);

        // 儲存
        heroDoc.saveAs(new File(projectPath + "hero-woman-ps.png"), new PNGSaveOptions(), true);
        doc.close(SaveOptions.DONOTSAVECHANGES);
        heroDoc.close(SaveOptions.DONOTSAVECHANGES);
        return true;
    }

    // ===== 處理男生 =====
    function processMan() {
        var srcFile = new File(projectPath + "hero-image-2.png");
        var doc = app.open(srcFile);

        try { doc.backgroundLayer.name = "Original"; } catch (e) {}
        try { doc.selection.deselect(); } catch (e) {}

        if (!runSelectSubject()) {
            alert("Select Subject 失敗 (男生)");
            return false;
        }

        try { doc.selection.copy(true); } catch (e) { doc.selection.copy(); }
        var cutLayer = doc.paste();
        cutLayer.name = "SUBJECT_CUT";
        try { doc.selection.deselect(); } catch (e) {}

        // 新畫布
        var heroDoc = app.documents.add(1920, 1080, 72, "Hero-Man", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

        // 深色背景
        var bgLayer = heroDoc.artLayers.add();
        bgLayer.name = "BG";
        heroDoc.selection.selectAll();
        var darkC = new SolidColor(); darkC.rgb.red = 18; darkC.rgb.green = 18; darkC.rgb.blue = 22;
        heroDoc.selection.fill(darkC);
        heroDoc.selection.deselect();

        // 橘色光暈
        var glowLayer = heroDoc.artLayers.add();
        glowLayer.name = "Glow";
        heroDoc.selection.select([[850,0],[1920,0],[1920,1080],[850,1080]]);
        heroDoc.selection.feather(new UnitValue(220, "px"));
        var orangeC = new SolidColor(); orangeC.rgb.red = 241; orangeC.rgb.green = 132; orangeC.rgb.blue = 1;
        heroDoc.selection.fill(orangeC);
        glowLayer.opacity = 15;
        heroDoc.selection.deselect();

        // 複製人物
        app.activeDocument = doc;
        cutLayer.duplicate(heroDoc, ElementPlacement.PLACEATBEGINNING);

        app.activeDocument = heroDoc;
        var pLayer = heroDoc.activeLayer;

        var b = pLayer.bounds;
        var h = b[3].value - b[1].value;
        var scale = (1150 / h) * 100;
        pLayer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

        var nb = pLayer.bounds;
        var nw = nb[2].value - nb[0].value;
        var nh = nb[3].value - nb[1].value;
        pLayer.translate(1920 - nw - 80 - nb[0].value, 1080 - nh + 120 - nb[1].value);

        heroDoc.saveAs(new File(projectPath + "hero-man-ps.png"), new PNGSaveOptions(), true);
        doc.close(SaveOptions.DONOTSAVECHANGES);
        heroDoc.close(SaveOptions.DONOTSAVECHANGES);
        return true;
    }

    // 執行
    var ok1 = processWoman();
    if (ok1) {
        var ok2 = processMan();
        if (ok2) {
            alert("完成！\n- hero-woman-ps.png\n- hero-man-ps.png");
        }
    }
})();
