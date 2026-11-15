/* L'humeur des personnages : ce qu'ils font quand on leur dit n'importe quoi, quand on les insulte,
   quand on leur parle d'objets qui n'existent pas encore.
   Ils ne comprennent pas, puis s'inquiètent, puis s'agacent, chacun selon son caractère,
   jusqu'à l'affrontement ; les plus faibles se taisent, menacent de prévenir quelqu'un, et le font.
   Aucune réplique n'est dite deux fois par le même personnage. */
(function (G) {
  'use strict';
  var H = {};

  // ---------------------------------------------------------------- ce qu'on reconnaît (texte normalisé : minuscules, sans accents)
  H.RX = {
    insulte: /\b(idiot|idiote|imbecile|con|conne|connard|connasse|cretin|cretine|abruti|abrutie|menteur|menteuse|salaud|salopard|salope|ordure|raclure|minable|vieux fou|vieille folle|incapable|stupide|debile|tare|taree|attarde|attardee|ta gueule|ferme la|la ferme|ferme ta bouche|degage|degagez|casse toi|cassez vous|fous le camp|foutez le camp|crapule|vermine|pourriture|charogne|fumier|batard|enfoire|enfoiree|encule|enculee|pute|petasse|pouffiasse|grognasse|tocard|bouffon|naze|nase|couillon|trou du cul|tete de noeud|sac a merde|pauvre type|pauvre con|pauvre fille|gros lard|grosse vache|vieille peau|vieux schnock|vieille bique|fils de pute|nique ta mere|nique|niquer|va te faire (foutre|voir|cuire un oeuf)|allez vous faire (foutre|voir|cuire un oeuf)|je (vous|t) emmerde|je (vous|te) deteste|je (vous|te) hais|espece d [a-z]+|espece de [a-z]+|sale (type|bete|porc|chien|chienne|vieux|vieille|menteur|menteuse|rital|rosbif|bonne femme|flic)|(vous etes|t es|tu es|quel|quelle) (un |une )?(gros |grosse |vieux |vieille |sale |pauvre |petit |petite |sacre |sacree )?(guignol|andouille|clown|charlot|rigolo|nul|nulle|cornichon|incapable|lamentable|pathetique|ridicule|grotesque|moche|bete)|vous puez|tu pues)\b/,
    juron: /\b(merde|putain|bordel|chier|fait chier|fais chier|nom de dieu|bon dieu de|sacre nom)\b/,
    menace: /\b(je vais|j vais|je vas|je veux|je pourrais|je devrais) (vous|te|t) (tuer|buter|frapper|cogner|casser la (gueule|figure|tete)|casser les dents|defoncer|egorger|etrangler|crever|eclater|massacrer|descendre|trouer|faire la peau|faire mal|faire regretter|faire taire|bruler)\b|\bje (vous|te) (tuerai|buterai|frapperai|ferai la peau|ferai regretter|ferai taire|casserai)\b|\b(vous|tu) (allez|vas|va) (le |me le )?regretter\b|\bgare a (vous|toi)\b|\bje (sais|connais) ou (vous habitez|tu habites|vous vivez|tu vis)\b|\b(vous|tu) (allez|vas) (mourir|crever|y passer)\b|\b(vous etes|t es|tu es) un homme mort\b/,
    excuse: /\b(excusez moi|excuse moi|je m excuse|je vous demande pardon|desole|desolee|navre|navree|je retire|je regrette|toutes mes excuses|mes excuses|pardonnez moi|pardonne moi|je ne voulais pas|je voulais pas|c etait une blague|c etait pour rire|je plaisantais|je rigolais|je me suis emporte|je me suis emportee|pardon)\b/,
    // des mots qui n'ont rien à faire dans une conversation sérieuse
    absurde: /\b(licornes?|zombies?|extraterrestres?|aliens?|caca|prout|pipi|zizi|crottes? de nez|je rote|je pete|je sais voler|je suis invisible|je suis immortel|je suis immortelle|je viens du futur|je viens de l avenir|voyage dans le temps|machine a remonter le temps|je lis dans vos pensees|je lis dans tes pensees|je suis dieu|je suis le pape|je suis napoleon|je suis jesus|je suis le pere noel|je suis le roi d angleterre|je suis la reine d angleterre|je suis le roi|je suis la reine|je suis votre (pere|mere)|je suis ton (pere|mere)|je suis ta mere)\b/,
    // ce qu'on peut prétendre être sans que ce soit un mensonge, mais une folie
    claimAbsurde: /^(banane|patate|saucisse|cornichon|poisson|poulet|canard|chat|chien|cheval|vache|cochon|lapin|souris|girafe|licorne|dragon|dinosaure|pingouin|singe|elephant|grenouille|crapaud|escargot|arbre|fleur|table|chaise|lampe|train|locomotive|wagon|pomme|carotte|tomate|fromage|baguette|croissant|robot|machine|ordinateur|vampire|zombie|extraterrestre|martien|alien|dieu|pape|roi|reine|empereur|napoleon|jesus|immortel|immortelle|invisible|super heros|superheros)$/
  };

  // les objets et les mots d'après 1923 : le personnage les répète tels qu'il les a entendus
  H.ANA = /\b(iphone|ipad|ipod|smartphones?|telephones? portables?|(un|mon|ton|votre|son|des|vos|mes|le) portables?|textos?|sms|mms|internet|site web|site internet|wifi|wi fi|bluetooth|gps|google|facebook|instagram|tiktok|tik tok|whatsapp|snapchat|twitter|youtube|netflix|spotify|amazon|uber|airbnb|bitcoins?|cryptomonnaies?|crypto|euros?|ordinateurs?|ordi|laptop|macbook|tablettes? tactiles?|ecran tactile|cle usb|usb|imprimante 3d|appli|applis|emails?|e mails?|(un|mon|ton|votre|par|des|vos|mes|ses|son) mails?|courriels?|emoji|emojis|selfies?|hashtags?|influenceur|influenceuse|youtubeur|youtubeuse|streaming|podcasts?|playstation|xbox|nintendo|game boy|gameboy|jeux? video|console de jeux?|television|tele|teleportation|micro ondes|four a micro ondes|avion a reaction|drones?|lasers?|bombe atomique|bombe nucleaire|nucleaire|centrale nucleaire|astronautes?|cosmonautes?|navette spatiale|covid|coronavirus|confinement|antibiotiques?|penicilline|sida|ovnis?|macarena|rap|techno|disco|rock n roll|hip hop|nutella|mcdo|mcdonald|mcdonalds|skateboard|trottinette electrique|mdr|ptdr|lol|wesh|swag|cringe|yolo|ok boomer)\b/;
  H.FUTUR = /\b(hitler|nazis?|nazisme|seconde guerre mondiale|deuxieme guerre mondiale|2e guerre mondiale|guerre froide|mur de berlin|union europeenne|11 septembre|on a marche sur la lune|premier homme sur la lune|beatles|elvis|elvis presley|michael jackson|marilyn monroe|de gaulle|mitterrand|chirac|sarkozy|macron|trump|obama|poutine|putin|mickey|star wars|harry potter|pokemon|zidane|mbappe|coupe du monde de football)\b/;
  // l'orthographe des marques, pour que le personnage les répète proprement
  H.CANON = { iphone: 'iPhone', ipad: 'iPad', ipod: 'iPod', google: 'Google', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', 'tik tok': 'TikTok', whatsapp: 'WhatsApp', snapchat: 'Snapchat', twitter: 'Twitter', youtube: 'YouTube', netflix: 'Netflix', spotify: 'Spotify', amazon: 'Amazon', uber: 'Uber', airbnb: 'Airbnb', playstation: 'PlayStation', xbox: 'Xbox', nintendo: 'Nintendo', 'game boy': 'Game Boy', gameboy: 'Game Boy', wifi: 'wifi', 'wi fi': 'wifi', bluetooth: 'Bluetooth', gps: 'GPS', usb: 'USB', 'cle usb': 'clé USB', sms: 'SMS', mms: 'MMS', pc: 'PC', macbook: 'MacBook', covid: 'Covid', mcdo: 'McDo', mcdonald: 'McDonald’s', mcdonalds: 'McDonald’s', nutella: 'Nutella', macarena: 'Macarena',
    hitler: 'Hitler', beatles: 'Beatles', elvis: 'Elvis', 'elvis presley': 'Elvis Presley', 'michael jackson': 'Michael Jackson', 'marilyn monroe': 'Marilyn Monroe', 'de gaulle': 'de Gaulle', mitterrand: 'Mitterrand', chirac: 'Chirac', sarkozy: 'Sarkozy', macron: 'Macron', trump: 'Trump', obama: 'Obama', poutine: 'Poutine', putin: 'Poutine', mickey: 'Mickey', 'star wars': 'Star Wars', 'harry potter': 'Harry Potter', pokemon: 'Pokémon', zidane: 'Zidane', mbappe: 'Mbappé', apollo: 'Apollo' };

  // ---------------------------------------------------------------- les caractères
  // kind : ce qui arrive au bout de la patience
  //   police : on vous met dehors, puis on vous arrête ; fort : on vous bouscule, puis on frappe ;
  //   gifle : on vous congédie, puis on vous gifle ; appel : on vous fait raccompagner, et l'on porte plainte ;
  //   faible : on se tait, on menace de prévenir quelqu'un, on le fait ; froid : on vous raye ; etrange : on ne vous voit plus
  // vite : calme, normal ou vif ; sup : qui l'on prévient ; police : la plainte remonte jusqu'à la police
  H.T = {
    // le prologue
    serveur: { kind: 'faible', vite: 'calme', sup: 'le chef de train', police: true,
      ins: [['Il ne cille pas. « Monsieur a raison, sans doute. Monsieur désire autre chose ? »'], ['« J’ai servi des généraux, monsieur. Ils avaient plus de vocabulaire. »']] },
    veuve: { kind: 'gifle', vite: 'normal', f: true,
      ins: [['« Charmant. Mon mari disait pire, et en meilleur français. »'], ['« Jeune homme, j’ai giflé un sous-préfet pour moins que ça. »']] },
    conducteur: { kind: 'fort', vite: 'vif', sup: 'le chef de train', police: true,
      coup: { txt: 'Paolo vous empoigne par le revers et vous plaque contre la cloison, l’avant-bras sous le menton.', deg: 1 },
      bz: [['« Come ? Je… je comprends pas, signore. »', '« Eh ? Qu’est-ce que vous dites, signore ? Je comprends rien. »'], ['« Vous avez bu le cognac de Bastien, eh ? Beaucoup de cognac ? »'], ['« Madonna… Vous perdez la tête, signore. C’est ce train. Ce train rend fou. »'], ['« Basta ! Basta, signore ! J’ai deux voitures à surveiller, moi ! »']],
      ins: [['« Ehi, signore ! Je suis de Domodossola, pas de Milan. On ne m’insulte pas comme ça. »'], ['« Attention, signore. Ma mamma m’a appris le respect. Elle m’a appris les poings aussi. »']],
      ana: ['« Un “{A}” ? Ma che cos’è ? Ça vient d’Amérique ? »', '« “{A}”… Mai sentito. Jamais entendu, signore. »'] },
    // Londres
    smith: { kind: 'froid', vite: 'calme' },
    beddows: { kind: 'faible', vite: 'calme', sup: 'un agent', police: true },
    fleming: { kind: 'police', vite: 'vif',
      bz: [[], ['« Vous avez bu. Pas la peine de nier, ça se voit à vos yeux. »'], ['« J’ai interrogé des fous, des vrais. Vous êtes en bonne voie. »'], ['« J’ai un meurtre sur le bureau et vous me racontez des fables. Ça suffit. »']],
      fin: { bz: ['« Sergent ! Raccompagnez cette personne jusqu’au trottoir. Et qu’elle y reste un moment. »'], ins: ['« Sergent ! » La porte s’ouvre aussitôt. « Mettez-moi ça au frais jusqu’à demain matin. Motif : outrage. »'] } },
    rigby: { kind: 'police', vite: 'normal' },
    sergent: { kind: 'police', vite: 'normal' },
    agentsj: { kind: 'police', vite: 'normal' },
    chelseaclerk: { kind: 'faible', vite: 'normal', sup: 'le gérant', police: true },
    mustapha: { kind: 'appel', vite: 'normal', sup: 'l’ambassadeur', police: true,
      fin: { bz: ['L’attaché sonne. Le garde de l’ambassade, un colosse moustachu, vous raccompagne jusqu’à la grille sans un mot.'], ins: ['L’attaché sonne. Le garde de l’ambassade vous prend par le bras, très fort. « Monsieur l’ambassadeur saura comment vous vous êtes conduit. Scotland Yard aussi. »'] } },
    voisin: { kind: 'fort', vite: 'vif', coup: { txt: 'Le buraliste contourne son comptoir plus vite qu’on ne l’en croirait capable, et son poing part.', deg: 3 } },
    atkins: { kind: 'gifle', vite: 'normal', f: true },
    butter: { kind: 'faible', vite: 'calme', sup: 'la police', police: true },
    alexis: { kind: 'etrange', vite: 'calme' },
    stanley: { kind: 'faible', vite: 'calme' },
    bibliothecaire: { kind: 'appel', vite: 'normal', sup: 'les gardiens', police: true,
      fin: { bz: ['Le conservateur lève un doigt. Deux gardiens en uniforme apparaissent, et l’on vous reconduit, très poliment, jusqu’aux colonnes du portique.'], ins: ['« Gardiens ! » Deux hommes en uniforme vous prennent sous les bras. Quatre cents lecteurs lèvent la tête. « Votre nom sera transmis à la direction. Et à qui de droit. »'] } },
    concierge: { kind: 'appel', vite: 'calme', sup: 'la direction', police: true,
      fin: { bz: ['Mr Pratt fait un signe à un groom. « Charles va vous raccompagner à votre chambre, {m}. Un peu de repos vous fera le plus grand bien. »'], ins: ['Mr Pratt pâlit, puis fait signe aux grooms. « Raccompagnez cette personne à sa chambre. » À voix plus basse : « Et que le portier aille chercher un agent. »'] } },
    laitier: { kind: 'faible', vite: 'normal', sup: 'l’agent', police: true },
    pike: { kind: 'appel', vite: 'vif', sup: 'les typographes', police: true, f: true,
      fin: { bz: ['« Dehors. » Mrs Pike désigne l’escalier d’un doigt sec. Elle ne vous regarde même plus.'], ins: ['« Bert ! Alfred ! » Deux typographes en tablier montent l’escalier en s’essuyant les mains. On vous raccompagne. Mrs Pike, derrière vous : « Je dépose une plainte. Votre nom, je l’ai. »'] } },
    vane: { kind: 'froid', vite: 'normal', f: true },
    patron: { kind: 'fort', vite: 'normal', coup: { txt: 'Barnaby Rudd pose son torchon. Deux habitués se lèvent en même temps que lui, et c’est le patron qui frappe le premier.', deg: 3 },
      fin: { ins: ['On vous jette sur le trottoir de Great Russell Street, sous les applaudissements du comptoir. Votre chapeau suit, un peu après.'] } },
    hollis: { kind: 'faible', vite: 'calme' }
  };
  // les registres qui n'ont pas leurs propres répliques
  H.REG = { soutenu: 'formel', etranger: 'populaire' };

  // ---------------------------------------------------------------- les répliques
  var L = H.L = {};
  // des gestes, au début : on ne comprend pas ; puis on s'inquiète ; puis on s'agace
  L.geste = [
    ['Un temps. On vous regarde comme si vous veniez de parler chinois.', 'Un long silence. On vous dévisage, la bouche entrouverte.', 'On vous regarde de biais, comme on regarde un chien qui se mettrait à parler.', 'Les sourcils se froncent, puis remontent très haut.', 'On cligne des yeux, deux fois, sans rien dire.', 'Un coup d’œil autour de soi, comme pour chercher un témoin.', 'Un petit rire nerveux, qui s’arrête net.', 'On vous fixe un moment, la tête un peu penchée.'],
    ['On vous observe avec une attention nouvelle, et pas très bienveillante.', 'On renifle discrètement, comme pour savoir si vous sentez l’alcool.', 'Un regard vers vos mains, puis vers vos yeux, puis de nouveau vers vos mains.', 'On recule d’un demi-pas, sans en avoir l’air.', 'Les lèvres se pincent.', 'On vous examine comme un médecin examine un malade qui ne lui plaît pas.'],
    ['La mâchoire se serre.', 'Un soupir exaspéré.', 'Des doigts tambourinent, de plus en plus vite.', 'Le ton monte d’un cran.', 'Les yeux se plissent.', 'On se redresse de toute sa taille.']
  ];
  // l'incompréhension, par registre : 0 on ne comprend pas, 1 on cherche une raison, 2 on conclut que vous perdez la tête, 3 on n'en peut plus
  L.bz = {
    formel: [
      ['« Je… je vous demande pardon ? Je ne suis pas certain de comprendre. »', '« Pardonnez-moi, {m}, je crains d’avoir perdu le fil. »', '« Je… Comment dire. Je ne vous suis pas du tout. »', '« Excusez-moi, mais… de quoi parlons-nous, exactement ? »', '« Vous… vous plaisantez, je suppose ? »'],
      ['« Vous vous sentez bien, {m} ? Voulez-vous un verre d’eau ? »', '« Est-ce une plaisanterie ? Si c’en est une, elle m’échappe. »', '« Auriez-vous pris un peu trop de porto, {m} ? Il n’y a pas de honte à cela. »', '« Je ne vois pas le rapport avec ce qui vous amène. Car quelque chose vous amène, n’est-ce pas ? »'],
      ['« Je crains, {m}, que vous ne soyez pas tout à fait dans votre assiette. »', '« Sans vouloir vous offenser, vous devriez consulter un médecin. Et rapidement. »', '« Vous tenez des propos décousus, {m}. Je commence à m’inquiéter pour vous. »', '« Je pense que vous perdez un peu la tête, si vous me passez l’expression. »'],
      ['« Bien. Je vais vous demander de vous reprendre, {m}, ou de prendre congé. »', '« Ma patience a des limites, {m}, et vous venez de les atteindre. »', '« Je n’ai pas de temps à perdre en sornettes. Venez-en au fait, ou retirez-vous. »', '« Une fois encore, et je mets fin à cet entretien. »']
    ],
    sec: [
      ['« Pardon ? Répétez ça. Non, en fait, ne répétez pas. »', '« Quoi ? »', '« Je n’ai rien compris. Et je comprends vite, d’habitude. »', '« C’est censé vouloir dire quelque chose ? »', '« Hein ? Vous pouvez reprendre depuis le début ? Ou plutôt, ne reprenez pas. »'],
      ['« Vous avez bu ? »', '« C’est une blague ? Je n’ai pas le temps pour les blagues. »', '« Vous êtes venu jusqu’ici pour me dire ça ? »', '« Vous avez pris quoi, ce matin ? Du laudanum ? »'],
      ['« Vous perdez les pédales. »', '« Vous divaguez. Allez dormir. »', '« J’ai vu des gens dans votre état. Ils finissent à Bedlam. »', '« Vous n’avez plus toute votre tête. Et je crois que vous le savez. »'],
      ['« Ça suffit. Dernier avertissement. »', '« Encore une ânerie et je vous fais sortir. »', '« Vous me faites perdre mon temps. Je n’aime pas qu’on me fasse perdre mon temps. »', '« Bon. Ou vous dites quelque chose de sensé, ou vous sortez. »']
    ],
    populaire: [
      ['« Euh… J’ai pas compris, là. »', '« Je… quoi ? »', '« Hein ? Vous pouvez répéter ? Non, en fait, répétez pas. »', '« Ben… je sais pas quoi vous répondre, {m}. »', '« Attendez, attendez. Qu’est-ce que vous racontez ? »'],
      ['« Vous vous sentez bien, {m} ? Vous êtes tout pâle. »', '« Vous avez bu un coup de trop, hein ? Ça arrive aux meilleurs. »', '« C’est pour rire, c’est ça ? On se moque de moi ? »', '« Vous avez pris un coup sur la tête, ou quoi ? »'],
      ['« Je crois que vous perdez les pédales, {m}. »', '« Vous avez une araignée au plafond, vous. »', '« Faudrait voir un docteur, {m}. Sérieusement. »', '« Ma mère avait un cousin qui causait comme ça. On l’a mis à l’asile. »'],
      ['« Bon, ça va, maintenant. Vous commencez à me courir. »', '« Arrêtez vos salades, ou ça va mal finir. »', '« Encore une fois, et je vous jure que je m’énerve. »', '« J’ai du travail, moi. Allez faire le guignol ailleurs. »']
    ],
    savant: [
      ['« Je… je ne comprends pas. Pas le moins du monde. »', '« Fascinant. Enfin, je crois. Je n’ai rien compris. »', '« Hum. Vous pourriez reformuler ? Je ne saisis pas. »', '« Voilà une phrase qui n’a ni queue ni tête. »', '« Je ne vois pas. Vraiment pas. »'],
      ['« Est-ce une énigme ? J’adore les énigmes, mais celle-ci m’échappe. »', '« Vous êtes fatigué{e}, {m}. Les nuits blanches font dire des choses curieuses. »', '« Avez-vous mangé, aujourd’hui ? Le jeûne produit ce genre de discours. »', '« Ce sont des mots, assurément. Mais ensemble, ils ne veulent rien dire. »'],
      ['« Je crains que vous ne perdiez pied, {m}. Je l’ai vu chez d’autres. »', '« Vous devriez voir un aliéniste. Je dis cela sans méchanceté. »', '« Votre raison vacille. Je connais les symptômes, j’ai fréquenté assez de médiums. »', '« Je pense que vous perdez les pédales, comme disent mes étudiants. »'],
      ['« Assez. Je n’ai plus la patience d’un jeune homme. »', '« Je vous écoute depuis tout à l’heure, et je n’entends que du bruit. Cela suffit. »', '« Si vous n’avez rien de sensé à dire, laissez-moi travailler. »', '« Une absurdité de plus, et je considère cette conversation comme close. »']
    ],
    domestique: [
      ['« Je… pardon, {m}, je ne comprends pas. »', '« {M} veut dire… ? Je ne suis pas sûr de suivre. »', '« Je crains de ne pas comprendre ce que {m} me demande. »', '« Pardon, {m}… Je ne sais pas quoi répondre à cela. »'],
      ['« {M} se sent-{il} bien ? {M} est un peu pâle. »', '« Puis-je apporter un verre d’eau à {m} ? Ou faire chercher un médecin ? »', '« {M} plaisante, sans doute. Je n’ai pas l’habitude des plaisanteries. »', '« {M} a-t-{il} pris quelque chose ? Un cordial, peut-être ? »'],
      ['« Je crois que {m} n’est pas tout à fait dans son état normal. »', '« Sauf le respect que je dois à {m}, {m} dit des choses bien étranges. »', '« Je vais faire comme si je n’avais rien entendu, {m}. »', '« {M} devrait se reposer. Je le dis pour son bien. »'],
      ['« Je regrette, {m}, mais j’ai du service. »', '« Si {m} veut bien m’excuser, on m’attend ailleurs. »', '« Je préfère ne pas répondre, {m}. »', '« {M} me pardonnera, je n’ai plus rien à dire. »']
    ],
    mondain: [
      ['« Pardon ? Je n’ai pas compris un traître mot. »', '« Plaît-il ? »', '« Mon pauvre {ami}, qu’est-ce que vous me chantez là ? »', '« Je… Ah. Non, vraiment, je ne vois pas. »', '« Vous parlez comme un poème moderne. Je n’ai jamais rien compris aux poèmes modernes. »'],
      ['« Vous avez bu, mon {cher} ? À votre âge, il faut savoir s’arrêter. »', '« C’est un jeu de société ? On jouait à ce genre de choses, dans les salons, avant la guerre. »', '« Vous vous sentez bien ? Vous avez une drôle de mine. »', '« Est-ce que vous vous moquez de moi ? Je n’aime pas qu’on se moque de moi. »'],
      ['« Je crois que vous perdez les pédales, mon pauvre {ami}. »', '« J’ai connu un excellent aliéniste. Je vous donnerai son adresse. »', '« Vous déraisonnez. C’est très fatigant à écouter. »', '« Il y a de la folie dans votre regard, et je m’y connais. »'],
      ['« Assez, je vous prie. Vous m’épuisez. »', '« Encore une sottise de ce genre et je vous fais reconduire. »', '« Je ne suis pas d’humeur. Ni maintenant, ni plus tard. »', '« Vous abusez de ma patience, et je n’en ai jamais eu beaucoup. »']
    ],
    fievreux: [
      ['« Je… Quoi ? Les mots… les mots tournent. »', '« Vous aussi, vous l’entendez ? Non. Ce n’est pas ça. Je ne comprends pas. »', '« Je ne comprends pas. Je ne comprends plus rien, depuis longtemps. »', '« Pardon… Je… Qu’est-ce que vous avez dit ? »'],
      ['« Vous êtes sûr d’être éveillé{e} ? Moi, je ne le suis jamais tout à fait. »', '« Ce n’est pas vous qui parlez. C’est la fatigue. Ou autre chose. »', '« Vous avez entendu des voix, vous aussi ? C’est comme ça que ça commence. »', '« Taisez-vous un instant. Écoutez. Non. Rien. Recommencez. »'],
      ['« Vous perdez pied. Je le vois. Je l’ai vu dans la glace. »', '« Ça vous prend aussi, hein ? La tête qui se défait. »', '« Vous êtes comme moi, maintenant. Je suis désolé. »', '« Il ne faut pas parler comme ça. Ils écoutent. »'],
      ['« Arrêtez. Arrêtez, je vous en prie. »', '« Taisez-vous ! Vous allez les faire venir ! »', '« Je ne peux pas. Je ne peux pas écouter ça. »', '« Partez. Partez, s’il vous plaît. »']
    ]
  };
  // les insultes, par registre : 0 on calme le jeu, 1 on avertit
  L.ins = {
    formel: [['« Allons, {m}, inutile de vous emporter. Nous pouvons parler calmement. »', '« Je vous en prie, calmez-vous. Je ne suis pas votre ennemi. »', '« Je mets cela sur le compte de la fatigue, {m}. Respirez. »'],
      ['« Je vous prie de surveiller votre langage. Je ne le répéterai pas. »', '« Je ne tolérerai pas d’être traité ainsi, {m}. »', '« Changez de ton, je vous prie. Tout de suite. »']],
    sec: [['« Doucement. Respirez. On se calme. »', '« Calmez-vous. Je mets ça sur le compte des nerfs. Une fois. »', '« Hé. On baisse d’un ton. »'],
      ['« Surveillez votre langue. Je ne le dirai pas deux fois. »', '« Encore un mot comme ça et ça va mal se passer. »', '« Vous parlez à quelqu’un qui a mauvais caractère. Rappelez-vous-en. »']],
    populaire: [['« Hé, hé, on se calme, {m}. Y a pas de quoi s’énerver. »', '« Oh là, doucement. Je vous ai rien fait, moi. »', '« Allez, respirez un bon coup. Ça va passer. »'],
      ['« Faites attention à ce que vous dites, {m}. Je suis pas votre paillasson. »', '« Vous changez de ton, ou ça va se gâter. »', '« J’aime pas trop qu’on me cause comme ça. Pas du tout, même. »']],
    savant: [['« Allons, allons. La colère est mauvaise conseillère, {m}. »', '« Calmez-vous, je vous en prie. Nous sommes entre gens raisonnables. Du moins, je l’espérais. »', '« Je comprends que vous soyez à bout. Asseyez-vous un instant. »'],
      ['« L’insulte ne vous honore pas, {m}. Je vous demande de cesser. »', '« J’ai été insulté par des médiums furieux. Ils avaient plus d’esprit que vous. Cessez. »', '« Je ne vais pas tolérer cela longtemps. »']],
    domestique: [['« {M} est contrarié{e}, je le comprends. Puis-je faire quelque chose ? »', '« Je vous en prie, {m}, calmez-vous. »', '« {M} ne pense pas ce qu’{il} dit, j’en suis sûr. »'],
      ['« Je dois demander à {m} de ne pas me parler ainsi. »', '« Je ne suis qu’un domestique, {m}, mais je ne suis pas un chien. »', '« {M} me pardonnera de ne pas répondre à cela. »']],
    mondain: [['« Calmez-vous, mon {cher}. On n’est pas au marché. »', '« Allons. Un peu de tenue. Respirez. »', '« Vous êtes nerveux. Prenez un sucre, ça calme. »'],
      ['« On ne me parle pas sur ce ton. Personne ne s’y est jamais risqué deux fois. »', '« Vous êtes d’une grossièreté rare. Je vous conseille de vous reprendre. »', '« Vous oubliez à qui vous parlez. »']],
    fievreux: [['« Ne criez pas. Ne criez pas, ils vont entendre. »', '« Calmez-vous… Je vous en prie. Je n’ai rien fait. »', '« Pourquoi vous êtes en colère ? C’est moi qui devrais avoir peur. »'],
      ['« Arrêtez. Vous êtes comme eux. »', '« Laissez-moi. Je n’ai pas besoin de ça en plus. »', '« Vous me faites mal, avec vos mots. »']]
  };
  // 2 : la menace, selon ce qu'on est capable de faire
  L.menace = {
    police: ['« Insulter un officier de police dans l’exercice de ses fonctions, ça s’appelle un outrage. Un mot de plus, et vous dormez au poste. »', '« Continuez comme ça, et c’est le panier à salade. »', '« Je vous préviens une fois : à la prochaine insulte, je vous passe les menottes. »'],
    fort: ['« Répétez ça, pour voir. Allez. Répétez. »', '« Encore un mot, et je vous fais sortir à coups de pied. »', '« Vous cherchez les coups, {m}. Vous allez les trouver. »'],
    appel: ['« Encore un mot, et je fais appeler quelqu’un pour vous reconduire. »', '« Je vous préviens : il me suffit de sonner pour que vous soyez dehors. »', '« Je vais devoir faire appel à {sup}, {m}. Ne m’y obligez pas. »'],
    faible: ['« Si vous continuez, je… je vais prévenir {sup}. »', '« Je vous préviens, je vais me plaindre à {sup}. »', '« Je vais appeler {sup}. Je vous jure que je vais le faire. »'],
    gifle: ['« Encore un mot, et je vous gifle. Et je gifle bien. »', '« Prenez garde, ou ma main partira toute seule. »', '« Vous allez recevoir une leçon de savoir-vivre. Une leçon cuisante. »'],
    froid: ['« Encore une insulte, et vous n’existerez plus pour moi. »', '« Continuez, et ma porte vous sera fermée. Pour de bon. »', '« Je vous laisse une dernière chance de vous conduire en personne civilisée. »'],
    etrange: ['« Continuez… Ils vous entendent aussi, vous savez. »', '« Vous ne savez pas à qui vous parlez. Moi non plus, d’ailleurs. »', '« Criez plus fort. Ça les fait venir. »']
  };
  // quand le joueur menace : la réaction dépend de ce qu'on est
  L.contre = {
    police: ['« Vous menacez un officier de police ? Réfléchissez bien à ce que vous allez dire ensuite. »', '« Des menaces. Devant témoins. » On sort un carnet. « Continuez, je prends des notes. »'],
    fort: ['« Me tuer ? Vous ? » Un rire mauvais. « Essayez, pour voir. »', '« Ah oui ? » On se lève, lentement. « Allez-y. Je vous attends. »'],
    appel: ['« Vous me menacez ? Très bien. » Une main se pose sur la sonnette.', '« Je n’ai pas bien entendu, et je vous conseille de ne pas répéter. »'],
    faible: ['« Vous… vous me menacez ? » {PIl} recule, livide.', '{PIl} pâlit et recule jusqu’au mur. « Je n’ai rien fait. Je n’ai rien fait… »'],
    gifle: ['« Me menacer, moi ? Vous ne manquez pas d’aplomb. »', '« Des menaces, à une femme ? Vous me dégoûtez. »'],
    froid: ['« Des menaces, maintenant. Vous tombez bien bas. »', '« Je vais faire comme si je n’avais rien entendu. Une fois. »'],
    etrange: ['« Vous menacez qui, au juste ? » Un sourire, qui ne vous plaît pas.', 'Il rit, d’un rire qui ne finit pas tout à fait.']
  };
  // au bout de la patience. bz : on vous a trop entendu divaguer ; ins : on vous a trop entendu insulter
  L.fin = {
    police: { bz: ['« Vous avez bu, ou vous êtes malade. Dans les deux cas, rentrez chez vous avant que je vous fasse dégriser au poste. » On vous montre la porte.', '« Allez cuver ailleurs. Je ne veux plus vous voir aujourd’hui. »', '« Dehors. Et revenez quand vous aurez retrouvé vos esprits. »'],
      ins: ['« Ça suffit. » Un sifflet, deux agents, et vos bras se retrouvent dans votre dos avant que vous ayez fini votre phrase.', '« Vous l’aurez voulu. » Les menottes claquent. Personne autour de vous ne semble surpris.'] },
    fort: { bz: ['{N} vous attrape par le col, sans brutalité mais sans réplique possible, et vous pousse vers la sortie. « Allez prendre l’air. Beaucoup d’air. »', '« Ça suffit, le cirque. » Une main lourde vous pousse dehors.'],
      ins: ['On vous pousse dehors. La porte claque derrière vous.', 'On vous jette dehors comme un sac de linge sale.'] },
    gifle: { bz: ['« Je n’écouterai pas une absurdité de plus. Laissez-moi. » {PIl} vous tourne le dos.', '« Vous êtes fou à lier. Allez-vous-en. »'],
      ins: ['La gifle part, sèche, sonore. Vous en avez la joue brûlante. « Voilà. Maintenant, sortez de ma vue. »', 'Vous ne voyez pas venir la gifle. Elle claque comme un coup de fouet. « Et ne revenez pas. »'] },
    appel: { bz: ['{N} fait un signe discret. On vous prend par le bras, poliment, fermement, et l’on vous raccompagne.', '« Je crois que vous avez besoin de repos. On va vous raccompagner. »'],
      ins: ['{N} fait un signe. On vous saisit par les deux bras. « Raccompagnez cette personne, je vous prie. Et notez son nom. »'] },
    faible: { sup: ['« Bien. Je vais chercher {sup}. » {PIl} s’éloigne d’un pas pressé, sans se retourner.', '{PIl} s’en va sans un mot. Plus loin, vous l’entendez prononcer votre nom, à voix basse, devant quelqu’un que vous ne voyez pas.', '« Vous l’aurez voulu. » {PIl} disparaît. On parlera de vous ce soir, à des gens qui ont le pouvoir de vous nuire.'],
      seul: ['{PIl} se détourne tout à fait. Pour aujourd’hui, vous n’obtiendrez plus rien.', '{PIl} se recroqueville et ne dit plus rien. Insister serait cruel, et inutile.'] },
    froid: { bz: ['« Je crois que cette conversation est terminée. » Et elle l’est.', '{N} se détourne. Pour aujourd’hui, vous n’existez plus.'],
      ins: ['« Sortez. Et ne revenez pas avant d’avoir retrouvé la raison et les bonnes manières. »', '« Je ne vous connais plus. » La voix est calme. C’est pire.'] },
    etrange: { bz: ['{N} ne vous regarde plus. {PIl} regarde à travers vous, quelque chose derrière votre épaule. Puis {Pil} se détourne, et vous ne savez plus très bien s’{Pil} était là.'],
      ins: ['{N} se tait. La lumière baisse, ou c’est vous. Quand vous relevez les yeux, {Pil} vous tourne le dos et ne bougera plus.'] }
  };
  // le silence des faibles : on commence à vous ignorer, puis on vous ignore
  L.silDebut = ['{PIl} semble commencer à vous ignorer.', '{PIl} se tait, et semble décidé{Pe} à ne plus vous répondre.', '{PIl} détourne les yeux. Visiblement, vous n’existez plus, pour l’instant.'];
  L.ignore = ['{PIl} semble avoir décidé de vous ignorer.', '{PIl} regarde ailleurs, comme si vous n’étiez pas là.', 'Pas de réponse. {PIl} fait mine d’être absorbé{Pe} par autre chose.', '{PIl} se tait. Ses yeux évitent soigneusement les vôtres.', 'Vous parlez dans le vide. {PIl} ne vous entend plus, ou ne veut plus vous entendre.', '{PIl} vous tourne à moitié le dos et attend que vous redeveniez raisonnable.', 'Un silence obstiné. {PIl} a visiblement décidé de ne plus rien entendre de ce genre.', '{PIl} hausse à peine les épaules, sans un mot.', 'Rien. Pas un regard. {PIl} attend que ça passe.'];
  L.supMenace = ['« Si vous continuez, je vais prévenir {sup}. »', '« Je… je vais en parler à {sup}. Je vous préviens. »', '« Encore une fois, et j’appelle {sup}. Je le ferai. »'];
  L.reprise = ['{PIl} relève lentement les yeux, méfiant{Pe}. On dirait que vous avez retrouvé vos esprits.', 'Un long soupir. {PIl} consent à vous regarder de nouveau.', '{PIl} hésite, puis se tourne vers vous, prudemment.', '{PIl} vous jauge un instant, puis se décide à répondre.', 'Le silence se rompt. {PIl} vous parle de nouveau, du bout des lèvres.', '{PIl} se détend un peu. À peine.'];
  // les excuses, quand il y a quelque chose à excuser
  L.excuse = {
    formel: ['« Excuses acceptées, {m}. N’en parlons plus. »', '« Bien. Je veux bien passer l’éponge. Une fois. »', '« Je prends note de vos excuses. Reprenons, voulez-vous ? »'],
    sec: ['« Bon. On oublie. Pour cette fois. »', '« Ça va. Mais je n’oublie jamais vraiment. »', '« Excuses notées. Venons-en au fait. »'],
    populaire: ['« Bon, ça va. On a tous nos mauvais jours. »', '« Allez, c’est oublié. Mais faites gaffe, hein. »', '« Ça me va. Sans rancune, {m}. »'],
    savant: ['« Excuses acceptées. L’erreur est humaine ; y persévérer serait diabolique. »', '« N’en parlons plus. Nous avons mieux à faire. »', '« Bien. Je vous pardonne. J’ai été jeune et nerveux, moi aussi. »'],
    domestique: ['« Ce n’est rien, {m}. »', '« {M} n’a pas à s’excuser. Enfin… merci. »', '« C’est oublié, {m}. »'],
    mondain: ['« Je vous pardonne. Je pardonne toujours, c’est ce qui me perd. »', '« Bon. Vous êtes impossible, mais vous savez vous excuser. C’est déjà ça. »', '« Excuses acceptées, mon {cher}. Ne recommencez pas. »'],
    fievreux: ['« Ce n’est pas grave. Rien n’est grave. Tout est grave. »', '« D’accord. D’accord. Ne criez plus. »', '« Je ne vous en veux pas. Je n’en veux qu’à eux. »']
  };
  L.excuseUsee = ['« Encore des excuses. Vous en faites une consommation effrayante. »', '« Vous vous excusez beaucoup, pour quelqu’un qui recommence toujours. »', '« Gardez vos excuses. Changez plutôt de conduite. »', 'Un haussement d’épaules. Les excuses ne prennent plus.'];
  // les mots d'après 1923 : 0 on s'étonne, 1 on se méfie, 2 on vous trouve dérangé
  L.ana = {
    formel: [['« “{A}” ? Je crains de ne pas connaître ce mot, {m}. »', '« Pardonnez-moi… un “{A}” ? Est-ce une invention récente ? »', '« “{A}”… Non, cela ne me dit rien. Est-ce américain ? »'],
      ['« Encore un “{A}” ? Vous employez des mots bien étranges, {m}. »', '« Je ne sais pas ce qu’est “{A}”, et je commence à me demander si vous le savez vous-même. »', '« “{A}” ? D’où tenez-vous ce vocabulaire ? Pas d’un dictionnaire, assurément. »'],
      ['« “{A}” ? Je ne sais pas ce que c’est, {m}, et je crains que vous ne déliriez. »', '« Assez de “{A}”, je vous prie. Ces mots n’existent pas. »']],
    sec: [['« “{A}” ? Connais pas. »', '« Un “{A}” ? C’est quoi, ce machin ? »', '« “{A}”. Jamais entendu ça de ma vie. »'],
      ['« Encore vos mots inventés. “{A}”, maintenant. »', '« “{A}” ? Vous lisez trop de romans de M. Wells. »', '« Je ne sais pas ce que c’est, un “{A}”, et je n’ai pas le temps de l’apprendre. »'],
      ['« “{A}” ? Vous délirez. »', '« “{A}”… Vous avez de la fièvre, ou vous vous fichez de moi. Dans les deux cas, ça suffit. »']],
    populaire: [['« Un quoi ? Un “{A}” ? Jamais vu ça, {m}. »', '« “{A}” ? C’est une marque de savon ? »', '« “{A}” ? C’est un mot d’Amérique, ça ? »'],
      ['« Encore un de vos “{A}” ? Vous parlez drôlement, vous. »', '« “{A}”… Je sais pas ce que c’est, et j’ai l’impression que vous non plus. »', '« Vous l’avez lu où, ça, “{A}” ? Dans un almanach ? »'],
      ['« Je sais pas ce que c’est, un “{A}”. Vous délirez, {m}. »', '« “{A}”, “{A}”… Vous avez de la fièvre, ma parole. »']],
    savant: [['« “{A}” ? Je ne connais pas ce mot. Un néologisme ? »', '« Un “{A}” ? Ni le grec ni le latin ne m’aident. »', '« “{A}”… Voilà un terme que je n’ai lu dans aucune revue savante. »'],
      ['« Encore un “{A}” ? Vous inventez des mots, ou vous les rapportez d’un pays que je ne connais pas ? »', '« “{A}”. Je note le mot. Je ne sais pas ce qu’il désigne, et je crains que personne ne le sache. »', '« “{A}”, dites-vous ? M. Wells en mettrait volontiers dans ses romans. »'],
      ['« “{A}” ? Je ne sais pas ce que c’est, et je crois que vous délirez, {m}. »', '« Assez de “{A}”. Ce sont des mots de fièvre. »']],
    domestique: [['« Un “{A}”, {m} ? Je ne connais pas. »', '« Pardon, {m}… “{A}” ? Je ne suis pas sûr de savoir ce que c’est. »', '« “{A}” ? Ce doit être une chose de la haute société, {m}. On n’en a pas, chez nous. »'],
      ['« Encore un “{A}”, {m} ? Je crains de ne pas suivre. »', '« Je ne sais pas ce qu’est un “{A}”, {m}. Et je ne suis pas sûr que {m} le sache non plus. »', '« “{A}”… {M} lit beaucoup, sans doute. »'],
      ['« Je ne sais pas ce que c’est, “{A}”, {m}. Sauf votre respect, {m} délire un peu. »', '« “{A}”, {m} ? Je crois que {m} a besoin de repos. »']],
    mondain: [['« Un “{A}” ? Comme c’est moderne. Je n’y comprends rien. »', '« “{A}” ? Vous avez de drôles de lectures. »', '« “{A}”… On dirait un nom de cheval de course. »'],
      ['« Encore un “{A}” ? Vous inventez des mots pour m’éblouir ? C’est raté. »', '« “{A}”… Les jeunes gens ont de ces mots, aujourd’hui. »', '« Je ne sais pas ce que c’est, un “{A}”, et je ne tiens pas à le savoir. »'],
      ['« “{A}” ? Vous délirez, mon pauvre {ami}. »', '« Encore “{A}” ! Je vais finir par croire que vous êtes fou. »']],
    fievreux: [['« “{A}”… Oui. Ça viendra. Tout vient. »', '« “{A}” ? Je ne connais pas. Mais le mot fait peur. »', '« Vous parlez comme quelqu’un qui n’est pas encore né. “{A}”… »'],
      ['« “{A}”… Ils disent ce mot, parfois, la nuit. »', '« Ne dites pas “{A}”. On ne sait pas ce qu’on appelle, avec ces mots-là. »', '« “{A}” ? Vous venez d’où, vous ? D’après ? »'],
      ['« “{A}”… Vous délirez. Comme moi. Comme nous tous. »', '« Taisez-vous avec vos “{A}” ! Vous m’embrouillez la tête ! »']]
  };
  // les gens et les événements d'après 1923
  L.futur = {
    h: ['« “{A}” ? Ce nom ne me dit rien. Devrait-il ? »', '« Je ne connais pas de “{A}”, {m}. Je lis pourtant les journaux tous les matins. »', '« “{A}” ? Qui est-ce ? Un homme politique ? Un chanteur de music-hall ? »', '« Vous parlez de “{A}” comme si tout le monde connaissait. Personne ne connaît, {m}. »', '« “{A}” ? Je crains que vous ne confondiez avec quelqu’un d’autre. Ou avec un rêve. »'],
    p: ['« “{A}” ? Connais pas. C’est un boxeur ? »', '« “{A}” ? Jamais entendu parler. »', '« Qui ça, “{A}” ? Il habite dans le quartier ? »', '« “{A}”… Non. C’était dans les journaux ? Moi, je l’ai pas vu. »', '« Je sais pas de qui vous parlez, {m}. “{A}”, vous dites ? »'],
    f: ['« “{A}”… Ce nom-là n’est pas encore arrivé. Il arrivera. »', '« Ne prononcez pas ce nom. Je ne sais pas pourquoi, mais ne le prononcez pas. »', '« “{A}” ? Les morts ne le connaissent pas. Les vivants non plus. »', '« Je ne connais pas. Je ne connais plus personne. »']
  };
  // la rancune : un personnage insulté répond du bout des lèvres (avant sa réponse : 0 à peine fâché, 1 vraiment fâché)
  L.rancune = {
    formel: [['Je passe sur votre ton.', 'Passons sur vos manières.', 'Je vous réponds, puisque vous y tenez.'], ['Je vous réponds, mais c’est bien la dernière fois que je supporte ce ton.', 'Vous ne méritez pas de réponse. En voici une quand même.', 'Du bout des lèvres, alors :']],
    sec: [['Bon.', 'Passons.', 'Je fais comme si je n’avais rien entendu.'], ['Je réponds, mais je n’oublie pas.', 'Vous avez de la chance que je sois de bonne humeur. Enfin, que je l’aie été.', 'Dernière réponse avant que je perde patience.']],
    populaire: [['Bon, je passe pour cette fois.', 'Ouais, bon.', 'Je vais vous répondre, mais faut pas pousser.'], ['Je vous réponds, mais c’est bien parce que je suis poli, moi.', 'Vous méritez pas que je vous réponde. Enfin…', 'Je vous le dis, et après vous me fichez la paix.']],
    savant: [['Laissons cela.', 'Passons, voulez-vous.', 'Je mets votre ton sur le compte de la fatigue.'], ['Je vous réponds, mais je n’apprécie guère vos manières.', 'Par principe, je réponds toujours aux questions. Même mal posées.', 'Ma réponse, et ensuite nous verrons si vous savez vous tenir.']],
    domestique: [['…', 'Bien, {m}.', 'Si {m} le dit.'], ['Je réponds à {m}, mais je n’en pense pas moins.', 'Puisque {m} me le demande.', '{M} a été dur{e}. Enfin.']],
    mondain: [['Passons.', 'Je fais semblant de n’avoir rien entendu.', 'Bon.'], ['Je vous réponds, mais vous me décevez.', 'Vous ne méritez pas que je vous parle. Enfin.', 'Par charité :']],
    fievreux: [['…', 'Ne criez pas…', 'Doucement…'], ['Vous avez été méchant. Mais je vais vous le dire.', 'Ils sont méchants aussi. Écoutez :', 'Je ne veux pas que vous criiez encore. Alors :']]
  };
  // trop fâché pour répondre : des excuses d'abord
  L.refus = {
    formel: ['« Je ne réponds pas aux gens qui m’insultent. Des excuses, d’abord. »', '« Vous espérez une réponse, après ce que vous m’avez dit ? »', '« Je vous écouterai quand vous aurez présenté des excuses. »'],
    sec: ['« Non. Vous m’avez insulté. Excusez-vous, ensuite on verra. »', '« Je ne travaille pas pour les gens qui m’insultent. »', '« Rien. Pas tant que vous ne vous serez pas excusé{e}. »'],
    populaire: ['« Je vous dis plus rien, moi. Pas après ce que vous m’avez sorti. »', '« Des excuses, d’abord. Après, on verra. »', '« Vous croyez que je vais vous répondre ? Après ça ? »'],
    savant: ['« Je ne discute pas avec quelqu’un qui m’insulte. Excusez-vous, et nous reprendrons. »', '« J’attends des excuses avant toute autre chose. »', '« Non. Vos manières d’abord. »'],
    domestique: ['« Je préfère ne pas répondre, {m}. »', '« Sauf votre respect, {m}, je ne répondrai pas. »', 'On baisse les yeux, sans répondre.'],
    mondain: ['« Je ne parle pas aux malappris. Excusez-vous, et nous verrons. »', '« Une réponse ? Après ces grossièretés ? Vous rêvez. »', '« Des excuses, mon {cher}. Ensuite, peut-être. »'],
    fievreux: ['« Non. Vous êtes comme eux. »', '« Je ne dirai rien. Rien. »', 'On se détourne, sans répondre.']
  };
  // un personnage qui vous a pris en sympathie (avant sa réponse, parfois)
  L.complice = {
    formel: ['Pour vous, volontiers.', 'Avec plaisir, {m}.', 'Je vous dirai tout ce que je sais.'],
    sec: ['Pour vous, je fais une exception.', 'Bon. Entre nous :', 'Je ne le dirais pas à tout le monde, mais :'],
    populaire: ['Pour vous, je veux bien.', 'Entre nous, hein :', 'Vous, vous m’êtes sympathique. Alors :'],
    savant: ['Ah, avec plaisir !', 'Entre gens de bonne compagnie :', 'Je vous dirai tout ce que je sais, et même un peu plus.'],
    domestique: ['Pour {m}, bien volontiers.', 'Si {m} me permet une confidence :', 'Avec plaisir, {m}.'],
    mondain: ['Pour vous, mon {cher}, je veux bien.', 'Entre nous, et que cela reste entre nous :', 'Vous m’êtes sympathique, alors écoutez :'],
    fievreux: ['Vous avez l’air honnête. Écoutez :', 'Vous, je vous crois. Alors :', 'Je vais vous le dire, à vous :']
  };
  // les compliments : après une insulte, quand on vous a déjà à la bonne, quand vous en faites trop
  L.flatRancune = {
    formel: ['« Vous m’insultez, puis vous me flattez ? Je ne suis pas dupe, {m}. »', '« Les compliments ne remplacent pas les excuses. »'],
    sec: ['« D’abord des insultes, maintenant des fleurs. Ça ne prend pas. »', '« Gardez vos compliments. Je préférerais des excuses. »'],
    populaire: ['« Ah, maintenant c’est des compliments ? Faudrait savoir. »', '« Vous me traitez de tous les noms, et après vous me passez de la pommade ? »'],
    savant: ['« L’insulte, puis la flatterie : je connais la méthode. Elle ne marche pas. »', '« Je préférerais des excuses à des compliments. »'],
    domestique: ['« {M} est bien changeant. »', '« Merci, {m}. Enfin… si {m} le pense. »'],
    mondain: ['« Une insulte, un compliment. Vous soufflez le chaud et le froid ? »', '« Trop tard pour les compliments, mon {cher}. »'],
    fievreux: ['« Vous changez de visage. Comme eux. »', '« Avant, vous criiez. Maintenant vous souriez. Je n’aime pas ça. »']
  };
  L.charmeDeja = {
    formel: ['« Vous allez me faire rougir, {m}. Que puis-je pour vous ? »', '« Vous êtes trop aimable. Vraiment. »'],
    sec: ['« Ça va, ça va. Je vous ai déjà à la bonne. Qu’est-ce que vous voulez ? »', '« Vous en faites trop. Mais je ne déteste pas. »'],
    populaire: ['« Arrêtez, vous allez me faire rougir ! »', '« Vous, alors. Qu’est-ce que je peux faire pour vous ? »'],
    savant: ['« Vous êtes d’une amabilité rare. Que puis-je pour vous ? »', '« Flatteur. Mais vous l’êtes avec goût. »'],
    domestique: ['« {M} me fait trop d’honneur. »', '« Merci, {m}. Que puis-je pour {m} ? »'],
    mondain: ['« Encore ? Vous allez me tourner la tête. »', '« Continuez, mon {cher}, je ne m’en lasse pas. »'],
    fievreux: ['« Personne ne m’avait parlé comme ça depuis longtemps. »', '« Merci. Merci. »']
  };
  L.flatTrop = {
    formel: ['« Vous l’avez déjà dit, {m}. Ça ne prend pas mieux la deuxième fois. »', '« La flatterie a ses limites. Vous les avez atteintes. »'],
    sec: ['« Encore ? Vous perdez votre temps. »', '« Les compliments, ça ne marche pas avec moi. Vous auriez dû le comprendre. »'],
    populaire: ['« Ça va, la pommade. J’ai compris. »', '« Vous en remettez une couche ? Ça marche pas, je vous dis. »'],
    savant: ['« Vous insistez. C’est presque touchant. Presque. »', '« La répétition ne rend pas un compliment plus sincère. »'],
    domestique: ['« {M} est bien aimable. {M} l’a déjà dit. »', '« Merci, {m}. Encore. »'],
    mondain: ['« Vous radotez, mon {cher}. Et vos compliments aussi. »', '« Une fois, c’était charmant. Deux fois, c’est suspect. »'],
    fievreux: ['« Pourquoi vous répétez ? Ils répètent aussi. »', '« Arrêtez de sourire comme ça. »']
  };
  // le jet de Charme : réussi, on vous prend en sympathie ; raté, on vous voit venir
  L.charmeOk = {
    formel: ['« Vous avez du goût, {m}. Je vous écoute, et de bon cœur. »', '« Voilà qui fait plaisir à entendre. Que puis-je faire pour vous ? »', 'Le visage se détend. « Vous êtes fort aimable. Je suis à votre disposition. »'],
    sec: ['Un coin de bouche se relève, malgré tout. « Bon. Vous n’êtes pas comme les autres. Allez-y, posez vos questions. »', '« Ça me change des imbéciles. Qu’est-ce que vous voulez savoir ? »', 'Un temps. Puis, presque un sourire. « D’accord. Vous avez gagné. »'],
    populaire: ['On rougit un peu. « Oh, ben, ça fait plaisir. Allez, demandez-moi ce que vous voulez. »', '« Vous, vous êtes quelqu’un de bien. Qu’est-ce que je peux faire pour vous ? »', '« Ça, on me le dit pas souvent. Merci. Pour vous, je ferai ce que je peux. »'],
    savant: ['« Ah ! Enfin quelqu’un qui sait reconnaître le travail bien fait. Je suis tout à vous. »', '« Vous êtes d’une rare délicatesse. Demandez, je répondrai. »', 'Un sourire ravi. « Voilà une conversation qui commence bien. »'],
    domestique: ['On se redresse, flatté. « Merci, {m}. C’est rare qu’on le remarque. Que puis-je pour {m} ? »', '« {M} est trop aimable. Je ferai tout mon possible. »', 'Un sourire timide. « Personne ne me dit jamais cela, {m}. »'],
    mondain: ['« Ah, enfin un peu de galanterie. Vous me plaisez. Que voulez-vous savoir ? »', 'Un rire charmé. « Vous savez parler aux dames, vous. Je vous écoute. »', '« Flatteur. Mais je vous pardonne : vous le faites bien. »'],
    fievreux: ['« Merci… Personne ne m’avait parlé doucement depuis si longtemps. »', 'Quelque chose s’apaise dans le regard. « Vous, je vous fais confiance. »', '« Merci. Je vous dirai. Je vous dirai tout. »']
  };
  L.charmeKo = {
    formel: ['« Vous êtes bien aimable, {m}. » Le ton reste parfaitement neutre.', '« Merci. » Rien de plus.', 'Un sourire poli, qui ne monte pas jusqu’aux yeux.'],
    sec: ['« Ça ne marche pas avec moi. »', '« Gardez ça pour quelqu’un que ça impressionne. »', 'Pas un muscle ne bouge sur le visage.'],
    populaire: ['« Ouais, ouais. On me la fait pas, à moi. »', '« C’est gentil. Mais je vous vois venir. »', '« Merci. » Un regard méfiant.'],
    savant: ['« Vous êtes aimable. Mais je ne suis pas sensible à la flatterie. »', '« Hum. Venons-en au fait, voulez-vous ? »', 'Un petit sourire sceptique.'],
    domestique: ['« Merci, {m}. » Le ton ne change pas d’un iota.', '« Trop aimable, {m}. » Pas un mot de plus.', 'Une courbette polie, et rien d’autre.'],
    mondain: ['« Vous êtes un flatteur, et un mauvais. »', '« Joli compliment. Je l’ai entendu cent fois. »', 'Un bâillement, à peine dissimulé.'],
    fievreux: ['« Vous dites ça pour que je parle. Ils faisaient pareil. »', '« Non. Non. Ne souriez pas. »', 'Un regard vide. Le compliment ne l’a pas atteint.']
  };
  // la police a entendu parler de vous
  L.plaintePolice = ['« Avant toute chose : on a reçu une plainte contre vous. Insultes, esclandre. Je vous conseille de vous tenir tranquille dans mon secteur. »', '« On m’a parlé de vous. Un témoin dit que vous avez perdu votre sang-froid. Je n’aime pas les gens qui perdent leur sang-froid. »', '« Votre nom est arrivé sur mon bureau. Une plainte. Je l’ai mise sous la pile. Elle peut remonter. »'];

  G.RPG = G.RPG || {};
  G.RPG.Humeur = H;
})(typeof window !== 'undefined' ? window : globalThis);
