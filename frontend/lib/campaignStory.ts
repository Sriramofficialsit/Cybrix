// Story for the Networking campaign map: what happens in each world.
// The map reads this; writers can change it without touching the engine.
//
//   name     the world's name on the map
//   intro    shown the first time the learner enters the world
//   npcs     things the dungeon's residents say as you pass them

export type WorldStory = {
  name: string;
  intro: { title: string; text: string };
  npcs: string[];
};

export const WORLD_STORIES: Record<number, WorldStory> = {
  1: {
    name: "The Boot Crypt",
    intro: {
      title: "The lights are on, but nobody's talking",
      text: "Down here every machine has power, yet not a single message leaves the crypt. Pixel says the first gate of the dungeon only opens for someone who knows what a network really is. Time to find out.",
    },
    npcs: [
      "Two devices and a link: that's already a network!",
      "My printer and laptop share one Wi-Fi. Neighbours, technically.",
      "The internet? Just networks talking to networks.",
      "Power light on doesn't mean connected. Learned that the hard way.",
    ],
  },
  2: {
    name: "Packet Mines",
    intro: {
      title: "Down where messages are mined",
      text: "Deep in the dungeon, miners chop every message into packets and stamp them with rules called protocols. Something is jamming the carts. Learn how data really moves to get them rolling again.",
    },
    npcs: [
      "Every message leaves these mines in small parcels. Packets!",
      "No protocol, no delivery. Rules keep the carts on track.",
      "Bandwidth is the width of the tunnel. Latency is how long the trip takes.",
      "Broadcast means shouting to everyone. Please don't.",
    ],
  },
  3: {
    name: "Switchyard Vaults",
    intro: {
      title: "The vaults where every cable meets",
      text: "Server racks hum in the dark, cables run everywhere, and nobody remembers which box does what. Sort the switches from the routers and the LANs from the WANs before the vaults grind to a halt.",
    },
    npcs: [
      "A switch knows every device in the room by name.",
      "Star, bus, ring, mesh: I've wired them all.",
      "Fibre carries light. Copper carries electrons. Wi-Fi carries hope.",
      "PAN, LAN, MAN, WAN: same idea, bigger circle.",
    ],
  },
  4: {
    name: "Tower of Layers",
    intro: {
      title: "Seven floors, one message",
      text: "The tower's scholars say every message climbs down seven floors and back up again on the other side. Climb the OSI tower, meet its TCP/IP rival, and see how data is wrapped at every floor.",
    },
    npcs: [
      "Physical at the bottom, Application at the top.",
      "Each floor wraps the data in another envelope.",
      "TCP/IP squeezes the seven floors into four.",
      "A router lives on floor three. Switches stay on two.",
    ],
  },
  5: {
    name: "Address Archives",
    intro: {
      title: "Every device needs an address",
      text: "The archivists keep two ledgers: MAC addresses burned into hardware, and IP addresses handed out by the network. A letter with the wrong address never arrives. Help them keep the records straight.",
    },
    npcs: [
      "A MAC address is a name. An IP address is a home.",
      "IPv4 is running out of room. IPv6 has plenty.",
      "Private addresses never leave the building.",
      "Subnet masks tell you who lives on your street.",
    ],
  },
  6: {
    name: "Port Gates",
    intro: {
      title: "A thousand doors on every wall",
      text: "Every service in the dungeon listens behind its own numbered gate. Learn which door the web uses, why some gates should stay shut, and how TCP knocks before it enters.",
    },
    npcs: [
      "Gate 443 is for secure web traffic. Mind the lock.",
      "TCP shakes hands three times before it talks.",
      "UDP just throws the letter over the wall.",
      "An open gate nobody guards is an invitation.",
    ],
  },
  7: {
    name: "Router Ridge",
    intro: {
      title: "Every path, every hop",
      text: "From the ridge you can see every path through the dungeon. Routers here decide where every packet goes next. Learn how switches remember faces, how ARP asks for names, and how routes are chosen.",
    },
    npcs: [
      "ARP shouts: who has this IP? Tell me your MAC!",
      "A router reads the destination and picks the next hop.",
      "Switches learn faces. Routers learn maps.",
      "The shortest road isn't always the fastest.",
    ],
  },
  8: {
    name: "Service Catacombs",
    intro: {
      title: "The catacombs that never sleep",
      text: "DNS keepers translate names into addresses, DHCP clerks hand out IPs, and the web keeps every tunnel busy. Find out what happens behind a single click.",
    },
    npcs: [
      "DNS: the dungeon's phone book.",
      "DHCP gave me this address. I just borrowed it.",
      "HTTP shouts. HTTPS whispers in code.",
      "One click here wakes up a dozen services.",
    ],
  },
  9: {
    name: "Firewall Citadel",
    intro: {
      title: "The last wall stands between you and the dark",
      text: "Attackers circle the citadel above the dungeon. Its guardians use firewalls, VPNs and watchful eyes to keep the network safe. Master the basics of defence, then take your first look through Wireshark.",
    },
    npcs: [
      "The firewall reads every packet at the gate.",
      "A VPN is a private tunnel through a public road.",
      "IDS watches. IPS acts.",
      "Wireshark shows you everything on the wire.",
    ],
  },
};
