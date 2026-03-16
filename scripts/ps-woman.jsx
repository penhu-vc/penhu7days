// 處理女生圖片 - 摳圖 + 延伸背景
#target photoshop

var projectPath = "/Users/yaja/projects/penhu7days/public/";

// 開啟原圖
var womanFile = new File(projectPath + "hero-image.png");
app.open(womanFile);

// 使用 Select Subject
var idSelectSubject = stringIDToTypeID("selectSubject");
var desc = new ActionDescriptor();
desc.putInteger(stringIDToTypeID("sampleAllLayers"), 0);
executeAction(idSelectSubject, desc, DialogModes.NO);

// 擴展選區讓邊緣更自然
app.activeDocument.selection.expand(new UnitValue(2, "px"));
app.activeDocument.selection.feather(new UnitValue(1, "px"));

// 複製到新圖層
app.activeDocument.selection.copy();
var personLayer = app.activeDocument.paste();
personLayer.name = "Person";

// 取消選取
app.activeDocument.selection.deselect();

// 建立新文件 1920x1080
var newDoc = app.documents.add(1920, 1080, 72, "Hero-Woman", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

// 複製人物圖層到新文件
app.activeDocument = app.documents.getByName(womanFile.name);
personLayer.duplicate(newDoc, ElementPlacement.PLACEATBEGINNING);

// 切換到新文件
app.activeDocument = newDoc;

// 重新命名圖層
app.activeDocument.activeLayer.name = "Person";

// 建立漸變背景
var bgLayer = app.activeDocument.artLayers.add();
bgLayer.name = "Background";
bgLayer.move(app.activeDocument.layers[app.activeDocument.layers.length - 1], ElementPlacement.PLACEAFTER);

// 選全部
app.activeDocument.selection.selectAll();

// 設定漸變顏色 (奶茶色)
var foreColor = new SolidColor();
foreColor.rgb.red = 200;
foreColor.rgb.green = 170;
foreColor.rgb.blue = 135;
app.foregroundColor = foreColor;

var backColor = new SolidColor();
backColor.rgb.red = 160;
backColor.rgb.green = 135;
backColor.rgb.blue = 105;
app.backgroundColor = backColor;

// 填充漸變
var idGradient = charIDToTypeID("Grdn");
var desc1 = new ActionDescriptor();
var idFrom = charIDToTypeID("From");
var desc2 = new ActionDescriptor();
desc2.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0);
desc2.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 0);
desc1.putObject(idFrom, charIDToTypeID("Pnt "), desc2);
var idT = charIDToTypeID("T   ");
var desc3 = new ActionDescriptor();
desc3.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0);
desc3.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 1080);
desc1.putObject(idT, charIDToTypeID("Pnt "), desc3);
desc1.putEnumerated(charIDToTypeID("Type"), charIDToTypeID("GrdT"), charIDToTypeID("Lnr "));
executeAction(idGradient, desc1, DialogModes.NO);

app.activeDocument.selection.deselect();

// 調整人物大小和位置
app.activeDocument.activeLayer = app.activeDocument.layers.getByName("Person");
var personLayer2 = app.activeDocument.activeLayer;

// 縮放
var bounds = personLayer2.bounds;
var layerH = bounds[3].value - bounds[1].value;
var targetH = 1050; // 稍微比畫布高
var scale = (targetH / layerH) * 100;
personLayer2.resize(scale, scale, AnchorPosition.MIDDLECENTER);

// 移動到右側
var newBounds = personLayer2.bounds;
var newW = newBounds[2].value - newBounds[0].value;
var newH = newBounds[3].value - newBounds[1].value;
var moveX = 1920 - newW - 50 - newBounds[0].value;
var moveY = 1080 - newH + 30 - newBounds[1].value;
personLayer2.translate(moveX, moveY);

// 儲存
var saveFile = new File(projectPath + "hero-woman-ps.png");
var pngOpts = new PNGSaveOptions();
pngOpts.compression = 6;
app.activeDocument.saveAs(saveFile, pngOpts, true);

alert("女生圖片處理完成！");
