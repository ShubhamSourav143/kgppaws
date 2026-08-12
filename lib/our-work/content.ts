import type { SlidePhoto } from "@/components/our-work/OurWorkSlideshow";

/**
 * Editorial content for the /stories ("Our Work") page.
 *
 * The page is a documentary tour of what KGP PAWS does on campus over a
 * full year. Photographs come from `public/images/` and are resolved by
 * the server component (see app/stories/page.tsx). All text on this page
 * is deliberately plain and un-dramatised — volunteers describing the
 * work, not marketing copy.
 */

export interface ShelterMember {
  slug: string;
  name: string;
  intro: string;
  journey: string;
  condition: string;
  /** Preferred filename stems for this dog's slideshow (looked up from the
   *  merged media pool). Extras get pulled in when photos are short. */
  photoKeys: string[];
  status: string;
  /** True for shelter family we have lost. Renders in the "In loving memory"
   *  subgroup with softer styling and the "Current condition" field relabelled
   *  to "Remembered for". */
  memoriam?: boolean;
  photos: SlidePhoto[];
}

export interface KnowledgeArticle {
  slug: string;
  title: string;
  category: string;
  summary: string;
  /** Full article, one string per paragraph. Rendered in the reader dialog
   *  opened by the card's "Read more" button. */
  body: string[];
  /** Preferred filename stem for the article cover. */
  photoKey: string;
  href?: string;
  photo?: SlidePhoto;
}

export interface WorkSectionContent {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  description: string;
  /** Photo folder key(s) preferred for this section. */
  folders: string[];
  /** Filename stems this section owns first, before falling back to the pool. */
  photoKeys: string[];
  /** Target photograph count for the slideshow. */
  targetCount: number;
  tone?: "cream" | "parchment" | "mist" | "night";
  aspect?: "video" | "wide" | "square" | "portrait";
}

export const SHELTER_MEMBERS: Omit<ShelterMember, "photos">[] = [
  {
    slug: "bunti",
    name: "Bunty",
    status: "In our care",
    photoKeys: ["bunty"],
    intro:
      "Bunty's story began with heartbreak. At just one and a half months old, he was found abandoned near the Gas Godown Gate of IIT Kharagpur. Alone and defenseless, he was attacked by a group of dogs from the nearby New Area, leaving him with a devastating spinal injury that permanently paralyzed his hind legs.",
    journey:
      "He came into KGP PAWS' care in 2023, when his chances of survival were uncertain. With constant medical attention, physiotherapy, and the unwavering dedication of our volunteers, Bunty fought through the hardest days. Although he never regained the ability to walk, he learned to live with courage, trust, and an unbreakable spirit.",
    condition:
      "Bunty is now the heart of our temporary shelter. Affectionately known as the \"Boss\" by everyone who meets him, he greets volunteers with excitement, keeps a watchful eye on every new arrival, and reminds us every day that resilience is stronger than tragedy. Bunty is a paraplegic dog, but he has never let his disability define him—he defines our shelter instead.",
  },
  {
    slug: "muesli",
    name: "Muesli",
    status: "In our care",
    photoKeys: ["muesli-04", "muesli-05", "muesli-02", "muesli-03", "muesli-01", "muesli-vid"],
    intro:
      "Muesli was just two months old when she was found abandoned near Azad Hall of Residence at IIT Kharagpur. Alone and vulnerable, she had been attacked by a much larger dog, leaving her with a severe spinal injury that caused permanent paralysis in her hind legs.",
    journey:
      "She was rescued by KGP PAWS and has been part of our shelter family ever since. Despite everything she has been through, Muesli never lost her joyful spirit. Surrounded by love, care, and daily support from our volunteers, she has grown into one of the happiest members of our shelter.",
    condition:
      "Muesli may not be able to walk, but she makes up for it with boundless energy and endless affection. She is incredibly friendly, playful, and always excited to meet new people. One look at her bright eyes and cheerful personality is enough to steal anyone's heart. Her disability has never stopped her from spreading happiness wherever she goes.",
  },
  {
    slug: "checker",
    name: "Checker",
    status: "In our care",
    photoKeys: ["checker"],
    intro:
      "Checker's journey is one of extraordinary strength. While pregnant, she was chased by a pack of dogs and desperately tried to escape by running into a nearby house. Frightened residents forced her back outside, where the chase continued. In the panic, she fell backwards from a wall, suffering a devastating spinal injury that left her permanently paralyzed.",
    journey:
      "The accident claimed the lives of all her unborn kittens, but Checker refused to give up. She was rescued by KGP PAWS and received the medical care, love, and rehabilitation she desperately needed. Over time, she recovered from her injuries and learned to trust people again, becoming a cherished member of our shelter family.",
    condition:
      "Although Checker remains paraplegic, she is now healthy, comfortable, and surrounded by people who care for her every day. She enjoys the safety of the shelter, the company of other rescued animals, and the affection of our volunteers. Her quiet resilience reminds us that even after unimaginable loss, life can still be filled with love, dignity, and hope.",
  },
  {
    slug: "sai",
    name: "Sai",
    status: "In our care",
    photoKeys: ["sai-1", "sai-2"],
    intro:
      "Sai was found at Kharagpur Railway Station, suffering from an unknown neurological condition that left her quadriplegic. When she was rescued by KGP PAWS, she was so weak that she couldn't even lift her head. Every movement was a struggle, and her future was uncertain.",
    journey:
      "With dedicated medical care, daily support, and endless love from our volunteers, Sai slowly began to regain her strength. Although she still cannot walk, she has learned to move around by crawling on her belly. Every small step in her recovery has been a victory, and we continue to hope that one day she may stand and walk again.",
    condition:
      "Sai is one of the most affectionate members of our shelter family. She greets every familiar face with trust and warmth, and has formed an especially deep bond with our volunteers. Her gentle nature, unwavering spirit, and determination inspire everyone who meets her. To us, Sai is a daily reminder that hope is worth holding onto, no matter how difficult the journey.",
  },
  {
    slug: "nami",
    name: "Nami",
    status: "In our care",
    photoKeys: ["nami-01", "nami-02", "nami-03"],
    intro:
      "Nami was just two months old when she was found abandoned near MMM Hall of Residence at IIT Kharagpur. Soon after being rescued, she developed a severe case of canine distemper. Despite being vaccinated, the disease attacked her nervous system, leaving her partially paralyzed. There were days when we feared she would not survive.",
    journey:
      "For more than six months, Nami received intensive medical treatment, physiotherapy, and round-the-clock care from our dedicated volunteers. Every tiny sign of improvement gave us hope, and Nami never stopped fighting. Her determination amazed everyone who cared for her.",
    condition:
      "Today, Nami is living proof that miracles can happen. She has regained the ability to run, play, and enjoy life like any other happy dog. Full of energy, affection, and endless excitement, she reminds us that love, patience, and perseverance can change a life forever. Nami's journey is one of our greatest success stories—and we couldn't be prouder of her.",
  },
  {
    slug: "romeo",
    name: "Romeo",
    status: "In loving memory",
    memoriam: true,
    photoKeys: ["romie"],
    intro:
      "Romeo was a true campus legend. His territory stretched from the IIT Kharagpur Main Building all the way to the Agricultural Department, where generations of students and staff came to know and love him. Friendly, confident, and impossibly charming, Romeo had a way of making everyone smile.",
    journey:
      "One tragic day, Romeo became the victim of a hit-and-run accident near the Agricultural Department. The impact left him permanently paralyzed. From that moment on, KGP PAWS became his family. Despite his disability, Romeo never lost his gentle spirit or his love for people. He spent his remaining years surrounded by the care and affection of countless volunteers who made sure he was never alone.",
    condition:
      "Romeo passed away in 2025, leaving behind memories that will never fade. Being adorable was his full-time job, and he carried it out perfectly every single day. His courage, quiet strength, and unconditional love touched everyone who met him. Though he is no longer with us, Romeo will forever remain a part of the KGP PAWS family and in the hearts of those who loved him.",
  },
  {
    slug: "three-leg",
    name: "3 Leg",
    status: "In loving memory",
    memoriam: true,
    photoKeys: ["three-leg-01", "three-leg-02", "three-leg-03"],
    intro:
      "In August 2024, 3 Leg was just four months old when a tragic train accident near IIT Kharagpur changed her life forever. The accident left her with devastating injuries, and one of her legs had to be amputated to save her life. Despite such a painful beginning, she faced every new day with remarkable courage and an endless capacity for love.",
    journey:
      "After recovering from surgery, she returned to her home at the NE Hospital campus of IIT Kharagpur. She quickly became a favorite among students, staff, and volunteers. Over-friendly by nature, she greeted everyone with complete trust, loved every meal with unmatched enthusiasm, and spread happiness wherever she went.",
    condition:
      "In March 2025, her health began to decline unexpectedly. She gradually became fully paralyzed, and despite every effort to help her, she peacefully crossed the Rainbow Bridge on 7 April 2025. Though her life was heartbreakingly short, 3 Leg filled it with unconditional love, boundless joy, and unwavering trust. She taught us that courage is not measured by how many legs you have, but by how fearlessly you choose to live.",
  },
  {
    slug: "shanti",
    name: "Shanti",
    status: "In loving memory",
    memoriam: true,
    photoKeys: ["shanti-vid"],
    intro:
      "Shanti was rescued from Kolkata and brought to the KGP PAWS temporary shelter by one of our dedicated volunteers. She was paraplegic, but her disability never stopped her from sharing love with everyone she met. From the moment she arrived, she became part of our family.",
    journey:
      "Though life had been unkind to her, Shanti greeted every new day with warmth and affection. She loved meeting people, happily showering volunteers and visitors with gentle licks in her own sweet way of asking for love. Her cheerful spirit and trusting nature made her impossible to forget, and she quickly won the hearts of everyone at the shelter.",
    condition:
      "We said goodbye to Shanti in 2025, but the love she gave continues to live on in our memories. She taught us that kindness needs no words—sometimes, a wagging tail and a gentle lick are enough to brighten someone's day. Her gentle soul will always remain a cherished part of the KGP PAWS family.",
  },
];

export const WORK_SECTIONS: WorkSectionContent[] = [
  {
    id: "chemotherapy",
    eyebrow: "Long-term treatment",
    title: "Chemotherapy Care",
    intro:
      "Not every illness can be treated in a single visit. Some campus dogs need chemotherapy and long-term medical support.",
    description:
      "Every week, KGP PAWS volunteers coordinate treatment, transport dogs to veterinary hospitals, administer medicines, monitor recovery and continue follow-up care until the full course is completed. This kind of care runs for months and needs a steady team behind it.",
    folders: ["donation/medical", "stories"],
    photoKeys: [
      "medical-01",
      "medical-02",
      "medical-03",
      "story-05",
      "story-06",
      "story-07",
      "story-08",
      "grid-03",
      "grid-04",
    ],
    targetCount: 12,
    tone: "cream",
  },
  {
    id: "sterilization",
    eyebrow: "Population control",
    title: "Sterilization Programme",
    intro:
      "Sterilization is one of the most important animal welfare activities we carry out. It reduces suffering more than any other single programme we run.",
    description:
      "Every week, volunteers safely transport campus dogs to Kolkata for sterilization and post-operative care. Over the years, KGP PAWS has helped complete more than 400 sterilizations — improving the health of campus animals and helping keep the population stable and healthy.",
    folders: ["donation/sterilization", "stories"],
    photoKeys: [
      "ster-01",
      "ster-02",
      "ster-03",
      "ster-04",
      "ster-05",
      "ster-06",
      "ster-07",
    ],
    targetCount: 7,
    tone: "parchment",
  },
  {
    id: "rescue",
    eyebrow: "When the call comes",
    title: "Rescue & Rehabilitation",
    intro:
      "Every rescue begins with a phone call, a message, or someone on campus noticing an animal in need.",
    description:
      "Throughout the year, KGP PAWS rescues abandoned puppies, injured campus dogs and lost pet dogs found within IIT Kharagpur. After the rescue, every animal receives treatment, food, vaccination and rehabilitation. Wherever it is safe and possible, healthy rescued animals are responsibly adopted into loving homes.",
    folders: ["donation/rescue", "stories", "adopt"],
    photoKeys: [
      "story-11",
      "story-12",
      "story-05",
      "story-06",
      "laika",
      "rocket",
      "grid-08",
      "grid-09",
    ],
    targetCount: 9,
    tone: "cream",
  },
  {
    id: "feeding",
    eyebrow: "Every single day",
    title: "Feeding Programme",
    intro:
      "Campus life changes during vacations. When students leave IIT Kharagpur for the summer, winter and autumn breaks, many campus dogs lose their regular food sources.",
    description:
      "During these periods — and every other day of the year — KGP PAWS volunteers continue feeding approximately 350 campus dogs. The rounds go out in the morning and again in the evening, in rain or heat, so the animals never miss a meal.",
    folders: ["donation/feeding", "stories"],
    photoKeys: [
      "feed-04",
      "feed-05",
      "feed-06",
      "feed-07",
      "feed-08",
      "feed-09",
      "feed-10",
    ],
    targetCount: 7,
    tone: "parchment",
  },
  {
    id: "vaccination",
    eyebrow: "Prevention first",
    title: "Vaccination Programme",
    intro:
      "Regular vaccination protects both the animals and the campus community they live alongside.",
    description:
      "KGP PAWS conducts vaccination drives throughout the year to reduce the spread of rabies, distemper and other preventable diseases. A single vaccination in time can save an animal's life and prevent a serious health risk for anyone sharing the road with them.",
    folders: ["donation/vaccination", "stories"],
    photoKeys: [
      "vacc-vid",
      "vacc-04",
      "vacc-05",
      "vacc-06",
      "vacc-07",
      "vacc-08",
      "vacc-09",
      "vacc-10",
    ],
    targetCount: 8,
    tone: "cream",
  },
  {
    id: "daily-medical",
    eyebrow: "Continuous work",
    title: "Daily Medical Care",
    intro:
      "This section represents the work that happens almost every day. Many of these cases never become rescue stories — they are simply part of caring for a campus of animals.",
    description:
      "Volunteers regularly help animals suffering from skin diseases, open wounds, maggot wounds, tick infestation, fractures, weakness, dehydration, fever, road accident injuries and general distress. Some cases need first aid on the spot. Others need transport to veterinary hospitals. Many require medicines, dressing changes and follow-up visits over several days or weeks.",
    folders: ["donation/medical", "stories", "adopt"],
    photoKeys: [
      "medical-01",
      "medical-02",
      "medical-03",
      "story-10",
      "story-11",
      "story-12",
      "odin",
      "bunti",
      "grid-01",
      "grid-02",
      "grid-08",
    ],
    targetCount: 12,
    tone: "parchment",
  },
];

export const KNOWLEDGE_ARTICLES: Omit<KnowledgeArticle, "photo">[] = [
  {
    slug: "why-sterilization-matters",
    title: "Why Sterilization Matters",
    category: "Health",
    summary:
      "Sterilization is not about fewer dogs — it is about fewer dogs born into hunger and disease. Here is why it is the single most humane thing we do.",
    photoKey: "ster-01",
    body: [
      "A single unsterilized female dog and her offspring can, in theory, lead to hundreds of puppies over a few years. On a campus like IIT Kharagpur, that does not mean hundreds of happy dogs — it means litters born under staircases and in drains during the monsoon, most of whom will not survive their first few months. The ones who do survive compete for the same scarce food, and the cycle repeats.",
      "Sterilization breaks that cycle humanely. It is a one-time surgical procedure — spaying for females, neutering for males — after which the animal can no longer reproduce. It does not change who the dog is. A friendly dog stays friendly; a shy dog stays shy. What changes is that no more puppies are born into a life of hunger and disease.",
      "The health benefits are real and well documented. Spaying a female before her first few heat cycles dramatically reduces the risk of mammary tumours and eliminates the risk of pyometra, a life-threatening uterine infection that is common and often fatal in unspayed street dogs. Neutered males roam less, fight less over mates, and are far less likely to be hit by vehicles or injured in territorial fights.",
      "There is a community benefit too. A stable, sterilized dog population is a calmer one. Sterilized dogs hold their territory quietly instead of a constant churn of new, unvaccinated animals moving through. This is the basis of the Animal Birth Control (ABC) programme recommended across India: sterilize, vaccinate, and return the animal to the exact place it came from.",
      "Over the years, KGP PAWS has helped complete more than 400 sterilizations. Every week, volunteers safely transport campus dogs for surgery and post-operative care. It is not dramatic work and it rarely makes a good photograph — but it prevents more suffering than anything else we do.",
    ],
  },
  {
    slug: "why-vaccination-is-important",
    title: "Why Vaccination Is Important",
    category: "Health",
    summary:
      "A single anti-rabies vaccine protects the animal and every person sharing the road with them. Simple, cheap, and one of the highest-impact things we do all year.",
    photoKey: "vacc-04",
    body: [
      "Rabies is almost always fatal once symptoms appear — in both animals and humans. India accounts for a large share of the world's human rabies deaths, and the overwhelming majority of those cases begin with a dog bite. The tragedy is that rabies is entirely preventable with a vaccine that costs very little.",
      "Vaccinating campus dogs protects them, but it protects people just as much. A vaccinated dog cannot carry and transmit rabies. When a high enough proportion of the dog population is vaccinated, the disease simply cannot spread — this is herd immunity, and it is the single most effective way to make a campus genuinely safe from rabies.",
      "Anti-rabies is the priority, but it is not the only vaccine that matters. Canine distemper — the disease that partially paralysed Nami before she recovered — attacks the nervous system and kills many young dogs every year. Parvovirus causes severe, often fatal, gastrointestinal illness in puppies. Both are preventable.",
      "KGP PAWS runs vaccination drives throughout the year. A dog that has been vaccinated by us often wears a PAWS collar tag; scanning the QR code on that tag shows its vaccination history. If you feed or care for a particular campus dog and are not sure whether it has been vaccinated, use the report form to let us know — we will add it to the next drive.",
      "If you are ever bitten or scratched by any animal, wash the wound with soap under running water for fifteen minutes and see a doctor the same day for post-exposure treatment. Do not wait for symptoms. With rabies, prevention is the only cure.",
    ],
  },
  {
    slug: "basic-first-aid-before-help-arrives",
    title: "Basic First Aid Before Help Arrives",
    category: "Emergency",
    summary:
      "What you can safely do in the first ten minutes after finding an injured animal, and what to avoid so you do not make things worse for the animal or yourself.",
    photoKey: "medical-01",
    body: [
      "An injured animal is a frightened animal, and a frightened animal may bite or scratch even someone trying to help — not out of aggression, but out of pain and fear. Your first responsibility is your own safety. You cannot help anyone if you are hurt yourself.",
      "Start by keeping calm and quiet. Approach slowly from the side rather than head-on, crouch to look less threatening, and speak in a low, steady voice. Give the animal a moment to understand that you are not a threat. If it growls, snaps, or tries to move away, stop — back off and call for trained help instead.",
      "If the animal is bleeding, gentle, steady pressure with a clean cloth is the single most useful thing you can do. Do not remove any object that has pierced the body — stabilise it in place and leave it for the vet. Do not apply turmeric, oil, chilli, or home remedies to open wounds; they contaminate the wound and make professional treatment harder.",
      "Do not give food, water, or any medicine to a seriously injured animal. If it needs surgery, food in the stomach is dangerous under anaesthesia. Human painkillers such as paracetamol and ibuprofen are toxic to dogs and cats and can kill them — never give them.",
      "If the animal is in shock — cold, limp, unresponsive — keep it warm with a cloth or blanket and minimise movement. For a suspected fracture or spinal injury, slide a flat, rigid surface underneath and move the whole body as one unit rather than lifting by the limbs.",
      "Then get help on the way. Note the exact location, take a photo if it is safe to do so, and use the Report button on this site. The most valuable thing you can provide is an accurate location and an honest description — that is what lets a volunteer reach the animal quickly.",
    ],
  },
  {
    slug: "what-to-do-if-you-find-an-injured-dog",
    title: "What To Do If You Find An Injured Dog",
    category: "Emergency",
    summary:
      "Step by step: approach carefully, keep distance if the animal is in pain, note the location precisely, and use the report form to get help on the way.",
    photoKey: "story-05",
    body: [
      "Finding an injured dog can be distressing, and the instinct is to rush in. A calm, methodical response helps the animal far more than a panicked one. Here is the sequence that works.",
      "First, observe from a short distance. Is the dog alert or unconscious? Bleeding, limping, or unable to stand? Is it on a road or somewhere safe? A dog that is alert and moving away from you does not want to be touched, and chasing it will only cause more harm — for that dog, a clear report is more useful than a rescue attempt.",
      "Second, keep yourself and traffic safe. If the dog is on a busy road, warn oncoming vehicles before you do anything else. Do not put yourself in the path of traffic.",
      "Third, note the location as precisely as you can — the nearest hall, department, gate, or landmark, and a Google Maps pin if possible. On a campus this large, \"near the main building\" can mean a fifteen-minute search. A precise pin can be the difference between a volunteer arriving in time or not.",
      "Fourth, submit a report using the Report button on this site. Add a photo if it is safe to take one, describe what you see plainly, and share a contact number if you are willing to guide the volunteer to the spot. For emergencies, a volunteer is paged immediately.",
      "Finally, if it is safe and the dog is calm, stay nearby until help arrives so you can point out where it went. If it is not safe, your report has already done the most important part. You do not need to handle a severely injured animal yourself — that is what our rescue team is trained and equipped for.",
    ],
  },
  {
    slug: "understanding-campus-dogs",
    title: "Understanding Campus Dogs",
    category: "Community",
    summary:
      "Campus dogs are not strays passing through — they are residents. How they behave, why territory matters to them, and how to share a lane peacefully.",
    photoKey: "grid-01",
    body: [
      "The dogs on the IIT Kharagpur campus are not lost or passing through. They were born here, they know these lanes better than most students do, and many have lived alongside the same halls and departments for years. Understanding them makes sharing the campus easier for everyone.",
      "Campus dogs are territorial, and that is the key to almost everything they do. A dog barks at a cyclist or a stranger not because it is aggressive, but because it is announcing a boundary. Once you belong to a place in its eyes — because you walk that lane every day, or because you have fed it calmly a few times — the same dog will usually greet you rather than warn you.",
      "Most conflict comes from misreading fear as aggression. A dog that is stiff, staring, with a low tail and raised hackles is asking for space, not a fight. The right response is to give it space: slow down, avoid direct eye contact, and do not run. Running triggers a chase instinct in even a friendly dog.",
      "Night-time barking and the occasional scuffle are usually territorial disputes between dogs, not a threat to people. A stable, sterilized population settles these boundaries and grows quieter over time — which is one more reason the sterilization programme matters.",
      "If a particular dog seems unwell, unusually aggressive, or is being fed in an unsafe place like a busy road, the best thing you can do is tell us through the report form rather than confronting the situation yourself. These are our neighbours, and a little patience on both sides goes a long way.",
    ],
  },
  {
    slug: "responsible-feeding-guidelines",
    title: "Responsible Feeding Guidelines",
    category: "Dog Care",
    summary:
      "What is safe to share, what is genuinely harmful, and why the where and when of feeding matters as much as the what.",
    photoKey: "feed-01",
    body: [
      "Feeding a hungry campus dog is a kind thing to do, and during vacations — when students leave and regular food sources disappear — it can be lifesaving. But how and where you feed matters as much as whether you feed.",
      "Plain, simple food is best: cooked rice mixed with a little curd, boiled egg, plain chicken or dog biscuits, and always clean water alongside. Dogs do well on unspiced, unsalted food. What they need most is consistency and clean water, not variety.",
      "Some common foods are genuinely dangerous. Chocolate, onions, garlic, grapes and raisins are toxic to dogs. Cooked bones splinter and can pierce the gut — never give them. Heavily spiced, oily, or salty leftovers cause stomach upsets and, over time, real harm. When in doubt, keep it plain.",
      "Where you feed is just as important. Never feed a dog on or beside a road — it teaches the animal to wait there for food and puts it directly in the path of traffic. Choose a safe, quiet spot away from vehicles and building entrances. Feed at a consistent time and place so the dogs learn the routine and are not left anxious.",
      "Clean up after every feed. Leftover food and disposable plates attract pests and give people a reason to resent the animals. A tidy feeding spot keeps both the dogs and the community on good terms.",
      "If you feed a dog regularly, you are in the best position to notice when something is wrong — a limp, a wound, weight loss, or a female who may be pregnant. That early notice, sent to us through the report form, often makes the difference in treatment.",
    ],
  },
  {
    slug: "puppy-care-basics",
    title: "Puppy Care Basics",
    category: "Dog Care",
    summary:
      "Feeding, warmth, deworming and the vaccine schedule that gets a puppy through the first year. Simple guidance for anyone finding a litter on campus.",
    photoKey: "story-11",
    body: [
      "Finding a litter of puppies on campus is common, especially after the monsoon. Before you do anything, pause and observe from a distance. If the puppies look clean, warm, and settled, the mother is very likely nearby and simply out finding food. Puppies almost always do best with their mother — removing them is rarely the right call and often a fatal one.",
      "Step in when the signs are clear: a puppy that is cold, crying continuously, visibly injured or sick, or in immediate danger from traffic or the weather, with no mother returning over several hours. In that case, report it to us — orphaned neonatal puppies need specialised, round-the-clock care that is hard to provide alone.",
      "Warmth is the first priority for a young puppy — more urgent than food. A puppy cannot regulate its own temperature, and a cold puppy will not digest food safely. Keep it warm and dry against a covered warm-water bottle or a warm cloth before anything else.",
      "Very young puppies need their mother's milk. If the mother is truly absent, they require a proper puppy milk replacer fed every few hours — never cow's or buffalo milk, which causes severe diarrhoea and can kill a young puppy. From around four weeks, softened puppy food can gradually be introduced.",
      "Deworming and vaccination follow a schedule. Puppies are typically dewormed from about two weeks of age and repeated regularly, with core vaccinations beginning around six to eight weeks and boosters after that, including anti-rabies. Getting this schedule right is what carries a puppy safely through its vulnerable first year — and it is exactly the kind of thing our team can guide you through.",
      "If you find a litter that needs help, the report form is the fastest way to reach us. Tell us the location, how many puppies, whether a mother is around, and their condition.",
    ],
  },
  {
    slug: "common-myths-about-street-dogs",
    title: "Common Myths About Street Dogs",
    category: "Community",
    summary:
      "Not all street dogs are aggressive. Not all are unwell. Clearing up the ideas that cause the most trouble for the animals and the people around them.",
    photoKey: "grid-08",
    body: [
      "A few persistent myths cause more trouble for campus dogs — and the people around them — than anything the dogs actually do. Clearing them up makes everyday life on campus calmer.",
      "\"Street dogs are naturally aggressive.\" They are not. The vast majority are shy and want nothing more than to be left alone. What looks like aggression is almost always fear or the defence of territory. A dog that is fed and treated calmly by the people it sees every day is a friendly neighbour, not a threat.",
      "\"Every street dog carries rabies.\" A vaccinated dog cannot transmit rabies, and vaccinating the campus population is exactly what our drives are for. A dog wearing a PAWS collar tag has been vaccinated — you can scan its QR tag to check. The way to make a campus rabies-safe is to vaccinate the dogs, not to fear them.",
      "\"Relocating the dogs will solve the problem.\" It does the opposite. Removing dogs from an area simply empties a territory that new, unvaccinated, unsterilized dogs move into — often more of them, and less settled. It is also illegal under Indian law. The proven approach is sterilize, vaccinate, and return the same animal to the same place.",
      "\"Feeding street dogs makes them dangerous.\" Responsible feeding, done in a safe and quiet spot, makes dogs calmer and more trusting, not more aggressive. Problems come from feeding on roads or leaving mess behind — not from the kindness itself.",
      "\"A dog that had puppies will be aggressive forever.\" A nursing mother is protective for a few weeks, which is natural. Give her space during that time and she returns to her usual self. Sterilization, once the pups are weaned, ends the cycle gently.",
    ],
  },
  {
    slug: "adoption-vs-buying-a-pet",
    title: "Adoption vs Buying a Pet",
    category: "Adoption",
    summary:
      "Where the animals sold in shops actually come from, and why adopting a healthy campus dog gives you the same companion at a fraction of the cost.",
    photoKey: "simba",
    body: [
      "When you decide to bring a dog into your life, the choice between adopting and buying is bigger than it first appears. It shapes an entire industry — and it decides whether an animal already waiting for a home gets one.",
      "Most pet-shop and breeder puppies come from commercial breeding operations where profit comes before welfare. Breeding females are often kept in poor conditions and bred repeatedly; puppies are frequently separated from their mothers too early and sold before their first vaccinations. The pedigree on paper says nothing about the animal's health or how it was raised.",
      "Buying also fuels demand. Every puppy bought from a breeder is a slot filled that an adoptable dog could have taken — while healthy, gentle dogs on this very campus wait for a family. Adoption does not just give one dog a home; it quietly reduces the demand that keeps breeding mills running.",
      "An adopted campus dog is, in every way that matters, the same companion — loyal, affectionate, and endlessly grateful. Indian street dogs, sometimes called Indies, are naturally hardy, well adapted to the local climate, and typically healthier and longer-lived than many heavily inbred pedigree breeds.",
      "KGP PAWS makes adoption straightforward and honest. There is no adoption fee — we only ask for a genuine commitment to lifetime care. Every adoptable animal is already vaccinated and sterilized, and a volunteer reviews each request personally to make sure the match is right for both the animal and the adopter.",
      "If you are ready, the Adopt page is the place to start. Meet the dogs and cats currently looking for homes, read their stories, and fill in the short application. Somewhere on that page may be the friend you have been looking for.",
    ],
  },
];
