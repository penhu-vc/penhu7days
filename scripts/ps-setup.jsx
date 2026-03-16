// 設定工作環境 - 開啟圖片並建立新畫布
#target photoshop

var projectPath = "/Users/yaja/projects/penhu7days/public/";

// === 步驟 1: 開啟女生圖片 ===
var womanFile = new File(projectPath + "hero-image.png");
app.open(womanFile);
alert("已開啟女生圖片。\n\n請手動執行：\n1. 選取 > 主體\n2. 或使用「移除背景」\n\n完成後按確定繼續...");

// === 步驟 2: 建立 Hero 畫布 ===
var heroDoc = app.documents.add(1920, 1080, 72, "Hero-Woman-Final", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

// 建立漸變背景
var bgLayer = heroDoc.artLayers.add();
bgLayer.name = "Gradient-BG";

heroDoc.selection.selectAll();

// 奶茶色漸變
var foreColor = new SolidColor();
foreColor.rgb.red = 210;
foreColor.rgb.green = 180;
foreColor.rgb.blue = 145;
app.foregroundColor = foreColor;

var backColor = new SolidColor();
backColor.rgb.red = 165;
backColor.rgb.green = 140;
backColor.rgb.blue = 110;
app.backgroundColor = backColor;

// 漸變填充
var idGrdn = charIDToTypeID("Grdn");
var descGrad = new ActionDescriptor();

var idFrom = charIDToTypeID("From");
var descFrom = new ActionDescriptor();
descFrom.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0);
descFrom.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 0);
descGrad.putObject(idFrom, charIDToTypeID("Pnt "), descFrom);

var idT = charIDToTypeID("T   ");
var descTo = new ActionDescriptor();
descTo.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0);
descTo.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 1080);
descGrad.putObject(idT, charIDToTypeID("Pnt "), descTo);

descGrad.putEnumerated(charIDToTypeID("Type"), charIDToTypeID("GrdT"), charIDToTypeID("Lnr "));
executeAction(idGrdn, descGrad, DialogModes.NO);

heroDoc.selection.deselect();

// 加一個光暈圖層
var glowLayer = heroDoc.artLayers.add();
glowLayer.name = "Glow";

// 橢圓選區
var region = [
  [1100, 200],
  [1850, 200],
  [1850, 880],
  [1100, 880]
];
heroDoc.selection.select(region);
heroDoc.selection.feather(new UnitValue(180, "px"));

var glowColor = new SolidColor();
glowColor.rgb.red = 255;
glowColor.rgb.green = 230;
glowColor.rgb.blue = 200;
heroDoc.selection.fill(glowColor);
glowLayer.opacity = 50;

heroDoc.selection.deselect();

alert("背景已建立！\n\n現在請：\n1. 回到女生圖片\n2. 複製摳好的人物\n3. 貼到這個新畫布\n4. 調整大小和位置（放右側）\n\n完成後儲存為 hero-woman-ps.png");
