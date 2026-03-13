export const CATEGORY_DEFINITIONS = [
  { slug: "obst-gemuese", name: "Obst & Gemüse", tone: "#eadfc6", textColor: "#a56100" },
  { slug: "fleisch-fisch", name: "Fleisch & Fisch", tone: "#e5dce6", textColor: "#7a416e" },
  { slug: "kaese-eier-molkerei", name: "Käse & Molkerei", tone: "#dde6df", textColor: "#2a6b3c" },
  { slug: "tiefkuehlkost", name: "Tiefkühlkost", tone: "#dce8eb", textColor: "#1f7286" },
  { slug: "brot-backwaren", name: "Brot & Backwaren", tone: "#efe1d2", textColor: "#9b5d18" },
  { slug: "vorrat-konserven", name: "Vorrat & Konserven", tone: "#efe6d8", textColor: "#8b5a1f" },
  { slug: "suesses-snacks", name: "Süßes & Snacks", tone: "#eedce3", textColor: "#a13863" },
  { slug: "getraenke", name: "Getränke", tone: "#dde7ef", textColor: "#255b96" },
  { slug: "kaffee-tee-kakao", name: "Kaffee, Tee & Kakao", tone: "#e8ddd3", textColor: "#7b4c24" },
  { slug: "drogerie-gesundheit", name: "Drogerie & Gesundheit", tone: "#dde3ec", textColor: "#255b96" },
  { slug: "mode-bekleidung", name: "Mode & Bekleidung", tone: "#eadde7", textColor: "#8a3766" },
  { slug: "sport-freizeit", name: "Sport & Freizeit", tone: "#dce7ea", textColor: "#256b7c" },
  { slug: "baby-tierbedarf", name: "Baby & Tierbedarf", tone: "#e4e1ef", textColor: "#5b4aa1" },
  { slug: "haushalt-kueche-garten", name: "Haushalt, Küche & Garten", tone: "#dee9e2", textColor: "#2f7645" },
  { slug: "sonstige", name: "Sonstige", tone: "#e7e2dc", textColor: "#6b6258" }
];

export const RETAILERS = [
  { slug: "aldi", name: "ALDI", color: "#1650a2" },
  { slug: "lidl", name: "Lidl", color: "#f4c400" },
  { slug: "denns", name: "Denns BioMarkt", color: "#2f7d32" },
  { slug: "norma", name: "NORMA", color: "#c4002b" },
  { slug: "edeka", name: "EDEKA", color: "#003b80" }
];

export const CATEGORY_RULES = [
  {
    slug: "vorrat-konserven",
    section: ["konserven", "vorrat", "speisekammer", "pasta", "reis", "saucen", "backzutaten", "grundnahrung", "teigwaren", "naehrmittel", "konfitueren", "brotaufstriche", "honig"],
    keywords: ["nudeln", "pasta", "reis", "konserve", "tomaten", "passierte", "mehl", "zucker", "kristallzucker", "öl", "oel", "essig", "gurke", "kichererbsen", "linsen", "polpa", "aufstrich", "brotaufstrich", "marmelade", "letscho", "gemuese mix", "suppe", "suppenliebe", "sauce", "hollandaise", "terrine", "noodles", "asia", "streichcreme", "honig", "bluetenhonig", "blütenhonig", "tortelloni", "maultaschen", "glasur", "zuckerglasur", "backzutaten", "dinkelnudeln", "cashewmus", "mandelmus"]
  },
  {
    slug: "kaffee-tee-kakao",
    section: ["kaffee", "tee", "kakao", "heißgetränke", "heissgetraenke"],
    keywords: ["kaffee", "espresso", "cappuccino", "latte", "tee", "kakao", "barista", "pads", "bohnen", "röstkaffee", "roestkaffee"]
  },
  {
    slug: "obst-gemuese",
    section: ["obst", "gemüse", "frucht", "salat", "kräuter", "gemuese", "frische"],
    keywords: ["apfel", "banane", "salat", "tomate", "avocado", "zitrone", "orange", "gurke", "paprika", "zucchini", "spargel", "kiwi", "erdbeere", "kartoffel", "zwiebel", "möhre", "karotte", "blumenkohl", "broccoli", "champignon", "mango", "birne"]
  },
  {
    slug: "fleisch-fisch",
    section: ["fleisch", "fisch", "wurst", "frischetheke", "bedientheke", "wurstwaren", "poekelware", "pökelware", "gefluegel frisch", "geflügel frisch"],
    keywords: ["lachs", "steak", "hähnchen", "haehnchen", "filet", "schinken", "salami", "hackfleisch", "gulasch", "braten", "saibling", "garnelen", "thunfisch", "puten", "rind", "schwein", "wiener", "mortadella", "wurst", "wurtspezialitaet", "wurstspezialitaet", "aufschnitt", "fleischbaellchen", "fleischbällchen", "cufte", "bacon", "burger", "fleischburger", "rindfleischburger", "jagdwurst", "knoblauchwurst", "mettwurst", "zwiebelmettwurst", "suppenfleisch", "lachsschinken", "landhaehnchen", "landhahnchen", "landhähnchen"]
  },
  {
    slug: "kaese-eier-molkerei",
    section: ["käse", "kaese", "molkerei", "eier", "joghurt", "frischkäse", "frischkaese", "quark", "milchersatzprodukte", "h milchprodukte"],
    keywords: ["joghurt", "fruchtjoghurt", "joghurtalternative", "milch", "käse", "kaese", "mozzarella", "butter", "ei", "eier", "skyr", "quark", "pudding", "sahne", "schlagsahne", "creme fraiche", "frischkäse", "frischkaese", "kefir", "haferdrink", "drink"]
  },
  {
    slug: "tiefkuehlkost",
    section: ["tiefkühl", "tiefkuehl", "eis", "pizza", "frozen"],
    keywords: ["pizza", "pommes", "eis", "tk", "fischstäbchen", "fischstaebchen", "lasagne", "tiefkühl", "tiefkuehl", "rahmspinat", "gemüsemischung", "gemuesemischung"]
  },
  {
    slug: "brot-backwaren",
    section: ["brot", "backwaren", "backshop", "bäckerei", "baeckerei", "brötchen", "broetchen"],
    keywords: ["brot", "müsli", "muesli", "toast", "croissant", "brötchen", "broetchen", "baguette", "semmel", "brezel", "knäckebrot", "kornschatz", "rosenbrötchen", "poffertjes", "roulade", "knusperbrot"]
  },
  {
    slug: "suesses-snacks",
    section: ["snacks", "süß", "suess", "schokolade", "kekse", "süsswaren", "suesswaren", "knabbern", "naschen"],
    keywords: ["schokolade", "tafelschokolade", "kekse", "chips", "toffifee", "goldhase", "gummibär", "gummibaer", "praline", "riegel", "cracker", "nüsse", "nuesse", "knusper", "dessert", "milchreis", "milka", "choco", "waffeln", "waffelwuerfel", "waffelwürfel", "kaesewaffeln", "mila", "horalky", "fruchtgummi", "erdnuss locken", "saltletts", "mandeln", "cashew bruch", "mousse", "puddingcreme", "nimm2", "maissnack", "grosse mischung", "große mischung", "osterfigur"]
  },
  {
    slug: "getraenke",
    section: ["getränke", "getraenke", "wasser", "saft", "limonade", "bier", "wein", "sekt", "spirituosen", "weinwelt", "weinart"],
    keywords: ["wasser", "cola", "fanta", "saft", "bier", "wein", "rotwein", "weisswein", "weißwein", "rosewein", "roséwein", "sekt", "limonade", "schorle", "cognac", "smoothie", "sprudel", "adelholzener", "whisky", "whiskey", "vodka", "gin", "rum", "likoer", "likör", "sahnelikoer", "sahnelikör", "kraeuterlikoer", "kräuterlikör"]
  },
  {
    slug: "drogerie-gesundheit",
    section: ["drogerie", "gesundheit", "pflege", "beauty", "kosmetik", "hygiene"],
    keywords: ["deo", "shampoo", "toilettenpapier", "zahnpasta", "seife", "duschgel", "creme", "rasierer", "binden", "tampons", "medikament", "vitamin", "sonnencreme", "massage", "massage gun", "wellness"]
  },
  {
    slug: "mode-bekleidung",
    section: ["mode", "damenmode", "herrenmode", "kinderkleidung", "kleider", "jumpsuits", "homewear", "schuhe", "textil"],
    keywords: ["sweatkleid", "sweathose", "hoodie", "sweatshirt", "kleid", "jumpsuit", "leggings", "jeans", "pyjama", "shirt", "pullover", "jacke", "mantel", "socken", "slip", "bh"]
  },
  {
    slug: "sport-freizeit",
    section: ["sport", "freizeit", "fitness", "wellness", "fahrrad", "camping", "outdoor", "spielzeug"],
    keywords: ["massage gun", "hantel", "yoga", "fitness", "fahrrad", "e bike", "trimmer", "camping", "zelt", "ball", "spiel", "roller", "scooter"]
  },
  {
    slug: "baby-tierbedarf",
    section: ["baby", "tier", "haustier", "windeln", "futter"],
    keywords: ["windeln", "baby", "feuchttücher", "feuchttuecher", "katzenfutter", "hundefutter", "streu", "tiernahrung", "welpen", "junior"]
  },
  {
    slug: "haushalt-kueche-garten",
    section: ["haushalt", "küche", "kueche", "garten", "wohnen", "reiniger", "werkzeug", "papierwaren", "heimwerkerbedarf", "baumarkt", "sonstiges", "gartenzeit"],
    keywords: ["spülmittel", "spuelmittel", "müllbeutel", "muellbeutel", "küchenrolle", "kuechenrolle", "folie", "reiniger", "pfanne", "topf", "messer", "box", "rasenmäher", "rasenmaeher", "grill", "schlauch", "nistkasten", "powerbank", "radio", "kaffeefilter", "blumen", "primeln", "tulpen", "teppich", "deko", "hochdruckreiniger", "leiter", "terrassendielen", "terrassenueberdachung", "terrassenüberdachung"]
  }
];
