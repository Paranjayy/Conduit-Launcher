"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Search, Copy, Clock, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useClipboardStore } from "@/lib/clipboard-store"

// Define the view types for type safety
type ViewType = 
  | "command" 
  | "clipboard" 
  | "pasteStack" 
  | "snippets" 
  | "appSearch" 
  | "preferences" 
  | "contextualShortcuts" 
  | "calculator" 
  | "menuSearch" 
  | "notes" 
  | "multiClipboard"
  | "emojiSearch"
  | "aiChat";

interface EmojiSearchProps {
  onViewChange: (view: ViewType) => void;
}

// Emoji categories
const CATEGORIES = [
  { id: 'recent', name: 'Recent', icon: <Clock className="h-4 w-4" /> },
  { id: 'favorites', name: 'Favorites', icon: <Star className="h-4 w-4" /> },
  { id: 'smileys', name: 'Smileys & Emotion', emoji: '😀' },
  { id: 'people', name: 'People & Body', emoji: '👋' },
  { id: 'animals', name: 'Animals & Nature', emoji: '🐶' },
  { id: 'food', name: 'Food & Drink', emoji: '🍔' },
  { id: 'travel', name: 'Travel & Places', emoji: '✈️' },
  { id: 'activities', name: 'Activities', emoji: '⚽' },
  { id: 'objects', name: 'Objects', emoji: '💡' },
  { id: 'symbols', name: 'Symbols', emoji: '❤️' },
  { id: 'flags', name: 'Flags', emoji: '🏳️' }
];

// Sample emoji data (in a real implementation, this would be a more complete dataset)
interface Emoji {
  emoji: string;
  name: string;
  category: string;
  keywords: string[];
}

// This is a small sample; a real implementation would include hundreds of emojis
const EMOJI_DATA: Emoji[] = [
  // Smileys & Emotion (50+ emojis)
  { emoji: '😀', name: 'Grinning Face', category: 'smileys', keywords: ['smile', 'happy', 'joy', 'grin'] },
  { emoji: '😃', name: 'Grinning Face with Big Eyes', category: 'smileys', keywords: ['smile', 'happy', 'joy', 'grin'] },
  { emoji: '😄', name: 'Grinning Face with Smiling Eyes', category: 'smileys', keywords: ['smile', 'happy', 'joy', 'grin'] },
  { emoji: '😁', name: 'Beaming Face with Smiling Eyes', category: 'smileys', keywords: ['smile', 'happy', 'joy', 'grin'] },
  { emoji: '😆', name: 'Grinning Squinting Face', category: 'smileys', keywords: ['smile', 'happy', 'joy', 'laugh'] },
  { emoji: '😅', name: 'Grinning Face with Sweat', category: 'smileys', keywords: ['smile', 'happy', 'relief', 'sweat'] },
  { emoji: '🙂', name: 'Slightly Smiling Face', category: 'smileys', keywords: ['smile', 'neutral', 'slight'] },
  { emoji: '🫠', name: 'Melting Face', category: 'smileys', keywords: ['melt', 'heat', 'dissolve'] },
  { emoji: '😊', name: 'Smiling Face with Smiling Eyes', category: 'smileys', keywords: ['blush', 'smile', 'happy'] },
  { emoji: '😇', name: 'Smiling Face with Halo', category: 'smileys', keywords: ['angel', 'innocent', 'halo'] },
  { emoji: '🥰', name: 'Smiling Face with Hearts', category: 'smileys', keywords: ['love', 'hearts', 'adore'] },
  { emoji: '😍', name: 'Smiling Face with Heart-Eyes', category: 'smileys', keywords: ['love', 'heart', 'adore'] },
  { emoji: '🤩', name: 'Star-Struck', category: 'smileys', keywords: ['star', 'excited', 'amazed'] },
  { emoji: '😘', name: 'Face Blowing a Kiss', category: 'smileys', keywords: ['kiss', 'love', 'heart'] },
  { emoji: '😗', name: 'Kissing Face', category: 'smileys', keywords: ['kiss', 'love'] },
  { emoji: '😚', name: 'Kissing Face with Closed Eyes', category: 'smileys', keywords: ['kiss', 'love'] },
  { emoji: '😙', name: 'Kissing Face with Smiling Eyes', category: 'smileys', keywords: ['kiss', 'love'] },
  { emoji: '🥲', name: 'Smiling Face with Tear', category: 'smileys', keywords: ['tear', 'sad', 'happy'] },
  { emoji: '😋', name: 'Face Savoring Food', category: 'smileys', keywords: ['delicious', 'yummy', 'food'] },
  { emoji: '😛', name: 'Face with Tongue', category: 'smileys', keywords: ['tongue', 'silly'] },
  { emoji: '😜', name: 'Winking Face with Tongue', category: 'smileys', keywords: ['wink', 'tongue', 'silly'] },
  { emoji: '🤪', name: 'Zany Face', category: 'smileys', keywords: ['crazy', 'wild', 'silly'] },
  { emoji: '😝', name: 'Squinting Face with Tongue', category: 'smileys', keywords: ['tongue', 'silly', 'squint'] },
  { emoji: '🤑', name: 'Money-Mouth Face', category: 'smileys', keywords: ['money', 'dollar', 'rich'] },
  { emoji: '🤗', name: 'Smiling Face with Open Hands', category: 'smileys', keywords: ['hug', 'embrace'] },
  { emoji: '🤭', name: 'Face with Hand Over Mouth', category: 'smileys', keywords: ['quiet', 'secret', 'whisper'] },
  { emoji: '🫢', name: 'Face with Open Eyes and Hand Over Mouth', category: 'smileys', keywords: ['shock', 'surprise'] },
  { emoji: '🫣', name: 'Face with Peeking Eye', category: 'smileys', keywords: ['peek', 'shy', 'curious'] },
  { emoji: '🤫', name: 'Shushing Face', category: 'smileys', keywords: ['quiet', 'secret', 'shush'] },
  { emoji: '🤔', name: 'Thinking Face', category: 'smileys', keywords: ['think', 'wonder', 'consider'] },
  { emoji: '🫡', name: 'Saluting Face', category: 'smileys', keywords: ['salute', 'respect', 'military'] },
  { emoji: '🤐', name: 'Zipper-Mouth Face', category: 'smileys', keywords: ['quiet', 'secret', 'zip'] },
  { emoji: '🤨', name: 'Face with Raised Eyebrow', category: 'smileys', keywords: ['suspicious', 'doubt'] },
  { emoji: '😐', name: 'Neutral Face', category: 'smileys', keywords: ['neutral', 'blank'] },
  { emoji: '😑', name: 'Expressionless Face', category: 'smileys', keywords: ['blank', 'deadpan'] },
  { emoji: '😶', name: 'Face Without Mouth', category: 'smileys', keywords: ['quiet', 'silent'] },
  { emoji: '🫥', name: 'Dotted Line Face', category: 'smileys', keywords: ['invisible', 'hidden'] },
  { emoji: '😏', name: 'Smirking Face', category: 'smileys', keywords: ['smirk', 'sly', 'mischievous'] },
  { emoji: '😒', name: 'Unamused Face', category: 'smileys', keywords: ['annoyed', 'unimpressed'] },
  { emoji: '🙄', name: 'Face with Rolling Eyes', category: 'smileys', keywords: ['eye', 'roll', 'annoyed'] },
  { emoji: '😬', name: 'Grimacing Face', category: 'smileys', keywords: ['grimace', 'awkward'] },
  { emoji: '😮‍💨', name: 'Face Exhaling', category: 'smileys', keywords: ['sigh', 'relief', 'exhale'] },
  { emoji: '🤥', name: 'Lying Face', category: 'smileys', keywords: ['lie', 'pinocchio', 'dishonest'] },
  { emoji: '😌', name: 'Relieved Face', category: 'smileys', keywords: ['relief', 'calm', 'peace'] },
  { emoji: '😔', name: 'Pensive Face', category: 'smileys', keywords: ['sad', 'thoughtful', 'pensive'] },
  { emoji: '😪', name: 'Sleepy Face', category: 'smileys', keywords: ['sleepy', 'tired'] },
  { emoji: '🤤', name: 'Drooling Face', category: 'smileys', keywords: ['drool', 'delicious'] },
  { emoji: '😴', name: 'Sleeping Face', category: 'smileys', keywords: ['sleep', 'tired', 'zzz'] },
  { emoji: '😷', name: 'Face with Medical Mask', category: 'smileys', keywords: ['mask', 'sick', 'medical'] },
  { emoji: '🤒', name: 'Face with Thermometer', category: 'smileys', keywords: ['sick', 'fever', 'ill'] },
  { emoji: '🤕', name: 'Face with Head-Bandage', category: 'smileys', keywords: ['injured', 'hurt', 'bandage'] },
  { emoji: '🤢', name: 'Nauseated Face', category: 'smileys', keywords: ['sick', 'nausea', 'green'] },
  { emoji: '🤮', name: 'Face Vomiting', category: 'smileys', keywords: ['sick', 'vomit', 'puke'] },
  { emoji: '🤧', name: 'Sneezing Face', category: 'smileys', keywords: ['sneeze', 'sick', 'tissue'] },
  { emoji: '🥵', name: 'Hot Face', category: 'smileys', keywords: ['hot', 'sweat', 'heat'] },
  { emoji: '🥶', name: 'Cold Face', category: 'smileys', keywords: ['cold', 'freeze', 'ice'] },
  { emoji: '🥴', name: 'Woozy Face', category: 'smileys', keywords: ['dizzy', 'confused', 'drunk'] },
  { emoji: '😵', name: 'Face with Crossed-Out Eyes', category: 'smileys', keywords: ['dead', 'knocked', 'out'] },
  { emoji: '😵‍💫', name: 'Face with Spiral Eyes', category: 'smileys', keywords: ['dizzy', 'confused', 'spiral'] },
  { emoji: '🤯', name: 'Exploding Head', category: 'smileys', keywords: ['mind', 'blown', 'explode'] },
  { emoji: '🤠', name: 'Cowboy Hat Face', category: 'smileys', keywords: ['cowboy', 'hat', 'western'] },
  { emoji: '🥳', name: 'Partying Face', category: 'smileys', keywords: ['party', 'celebrate', 'birthday'] },
  { emoji: '🥸', name: 'Disguised Face', category: 'smileys', keywords: ['disguise', 'glasses', 'mustache'] },
  { emoji: '😎', name: 'Smiling Face with Sunglasses', category: 'smileys', keywords: ['cool', 'sunglasses'] },
  { emoji: '🤓', name: 'Nerd Face', category: 'smileys', keywords: ['nerd', 'geek', 'glasses'] },
  { emoji: '🧐', name: 'Face with Monocle', category: 'smileys', keywords: ['monocle', 'curious', 'inspect'] },

  // People & Body (50+ emojis)
  { emoji: '👋', name: 'Waving Hand', category: 'people', keywords: ['wave', 'hello', 'goodbye'] },
  { emoji: '🤚', name: 'Raised Back of Hand', category: 'people', keywords: ['hand', 'stop', 'back'] },
  { emoji: '🖐️', name: 'Hand with Fingers Splayed', category: 'people', keywords: ['hand', 'five', 'spread'] },
  { emoji: '✋', name: 'Raised Hand', category: 'people', keywords: ['hand', 'stop', 'high'] },
  { emoji: '🖖', name: 'Vulcan Salute', category: 'people', keywords: ['spock', 'star', 'trek'] },
  { emoji: '🫱', name: 'Rightwards Hand', category: 'people', keywords: ['hand', 'right'] },
  { emoji: '🫲', name: 'Leftwards Hand', category: 'people', keywords: ['hand', 'left'] },
  { emoji: '🫳', name: 'Palm Down Hand', category: 'people', keywords: ['hand', 'palm', 'down'] },
  { emoji: '🫴', name: 'Palm Up Hand', category: 'people', keywords: ['hand', 'palm', 'up'] },
  { emoji: '👌', name: 'OK Hand', category: 'people', keywords: ['ok', 'good', 'perfect'] },
  { emoji: '🤌', name: 'Pinched Fingers', category: 'people', keywords: ['italian', 'chef', 'kiss'] },
  { emoji: '🤏', name: 'Pinching Hand', category: 'people', keywords: ['small', 'tiny', 'little'] },
  { emoji: '✌️', name: 'Victory Hand', category: 'people', keywords: ['peace', 'victory', 'two'] },
  { emoji: '🤞', name: 'Crossed Fingers', category: 'people', keywords: ['luck', 'hope', 'wish'] },
  { emoji: '🫰', name: 'Hand with Index Finger and Thumb Crossed', category: 'people', keywords: ['money', 'expensive'] },
  { emoji: '🤟', name: 'Love-You Gesture', category: 'people', keywords: ['love', 'rock', 'sign'] },
  { emoji: '🤘', name: 'Sign of the Horns', category: 'people', keywords: ['rock', 'metal', 'horns'] },
  { emoji: '🤙', name: 'Call Me Hand', category: 'people', keywords: ['call', 'phone', 'hang'] },
  { emoji: '👈', name: 'Backhand Index Pointing Left', category: 'people', keywords: ['point', 'left', 'finger'] },
  { emoji: '👉', name: 'Backhand Index Pointing Right', category: 'people', keywords: ['point', 'right', 'finger'] },
  { emoji: '👆', name: 'Backhand Index Pointing Up', category: 'people', keywords: ['point', 'up', 'finger'] },
  { emoji: '🖕', name: 'Middle Finger', category: 'people', keywords: ['middle', 'finger', 'rude'] },
  { emoji: '👇', name: 'Backhand Index Pointing Down', category: 'people', keywords: ['point', 'down', 'finger'] },
  { emoji: '☝️', name: 'Index Pointing Up', category: 'people', keywords: ['point', 'up', 'one'] },
  { emoji: '🫵', name: 'Index Pointing at the Viewer', category: 'people', keywords: ['point', 'you', 'finger'] },
  { emoji: '👍', name: 'Thumbs Up', category: 'people', keywords: ['thumbs', 'up', 'approve', 'like'] },
  { emoji: '👎', name: 'Thumbs Down', category: 'people', keywords: ['thumbs', 'down', 'disapprove', 'dislike'] },
  { emoji: '✊', name: 'Raised Fist', category: 'people', keywords: ['fist', 'power', 'solidarity'] },
  { emoji: '👊', name: 'Oncoming Fist', category: 'people', keywords: ['fist', 'punch', 'bump'] },
  { emoji: '🤛', name: 'Left-Facing Fist', category: 'people', keywords: ['fist', 'left', 'bump'] },
  { emoji: '🤜', name: 'Right-Facing Fist', category: 'people', keywords: ['fist', 'right', 'bump'] },
  { emoji: '👏', name: 'Clapping Hands', category: 'people', keywords: ['clap', 'applause', 'praise'] },
  { emoji: '🙌', name: 'Raising Hands', category: 'people', keywords: ['praise', 'celebrate', 'hooray'] },
  { emoji: '🫶', name: 'Heart Hands', category: 'people', keywords: ['heart', 'love', 'hands'] },
  { emoji: '👐', name: 'Open Hands', category: 'people', keywords: ['open', 'hands', 'hug'] },
  { emoji: '🤲', name: 'Palms Up Together', category: 'people', keywords: ['pray', 'please', 'hope'] },
  { emoji: '🤝', name: 'Handshake', category: 'people', keywords: ['handshake', 'deal', 'agreement'] },
  { emoji: '🙏', name: 'Folded Hands', category: 'people', keywords: ['pray', 'please', 'thanks'] },
  { emoji: '✍️', name: 'Writing Hand', category: 'people', keywords: ['write', 'pen', 'paper'] },
  { emoji: '💅', name: 'Nail Polish', category: 'people', keywords: ['nail', 'polish', 'beauty'] },
  { emoji: '🤳', name: 'Selfie', category: 'people', keywords: ['selfie', 'camera', 'phone'] },
  { emoji: '💪', name: 'Flexed Biceps', category: 'people', keywords: ['muscle', 'strong', 'flex'] },
  { emoji: '🦾', name: 'Mechanical Arm', category: 'people', keywords: ['robot', 'mechanical', 'prosthetic'] },
  { emoji: '🦿', name: 'Mechanical Leg', category: 'people', keywords: ['robot', 'mechanical', 'prosthetic'] },
  { emoji: '🦵', name: 'Leg', category: 'people', keywords: ['leg', 'limb', 'kick'] },
  { emoji: '🦶', name: 'Foot', category: 'people', keywords: ['foot', 'kick', 'toe'] },
  { emoji: '👂', name: 'Ear', category: 'people', keywords: ['ear', 'hear', 'listen'] },
  { emoji: '🦻', name: 'Ear with Hearing Aid', category: 'people', keywords: ['ear', 'hearing', 'aid'] },
  { emoji: '👃', name: 'Nose', category: 'people', keywords: ['nose', 'smell', 'sniff'] },
  { emoji: '🧠', name: 'Brain', category: 'people', keywords: ['brain', 'smart', 'think'] },
  { emoji: '🫀', name: 'Anatomical Heart', category: 'people', keywords: ['heart', 'organ', 'beat'] },
  { emoji: '🫁', name: 'Lungs', category: 'people', keywords: ['lungs', 'breathe', 'organ'] },
  { emoji: '🦷', name: 'Tooth', category: 'people', keywords: ['tooth', 'dental', 'smile'] },
  { emoji: '🦴', name: 'Bone', category: 'people', keywords: ['bone', 'skeleton', 'dog'] },
  { emoji: '👀', name: 'Eyes', category: 'people', keywords: ['eyes', 'look', 'see'] },
  { emoji: '👁️', name: 'Eye', category: 'people', keywords: ['eye', 'look', 'see'] },
  { emoji: '👅', name: 'Tongue', category: 'people', keywords: ['tongue', 'taste', 'lick'] },
  { emoji: '👄', name: 'Mouth', category: 'people', keywords: ['mouth', 'lips', 'kiss'] },
  { emoji: '🫦', name: 'Biting Lip', category: 'people', keywords: ['lip', 'bite', 'nervous'] },

  // Animals & Nature (40+ emojis)
  { emoji: '🐶', name: 'Dog Face', category: 'animals', keywords: ['dog', 'pet', 'animal'] },
  { emoji: '🐱', name: 'Cat Face', category: 'animals', keywords: ['cat', 'pet', 'animal'] },
  { emoji: '🐭', name: 'Mouse Face', category: 'animals', keywords: ['mouse', 'animal', 'rodent'] },
  { emoji: '🐹', name: 'Hamster Face', category: 'animals', keywords: ['hamster', 'pet', 'rodent'] },
  { emoji: '🐰', name: 'Rabbit Face', category: 'animals', keywords: ['rabbit', 'bunny', 'pet'] },
  { emoji: '🦊', name: 'Fox Face', category: 'animals', keywords: ['fox', 'animal', 'wild'] },
  { emoji: '🐻', name: 'Bear Face', category: 'animals', keywords: ['bear', 'animal', 'wild'] },
  { emoji: '🐼', name: 'Panda Face', category: 'animals', keywords: ['panda', 'bear', 'cute'] },
  { emoji: '🐻‍❄️', name: 'Polar Bear', category: 'animals', keywords: ['polar', 'bear', 'ice'] },
  { emoji: '🐨', name: 'Koala', category: 'animals', keywords: ['koala', 'australia', 'tree'] },
  { emoji: '🐯', name: 'Tiger Face', category: 'animals', keywords: ['tiger', 'cat', 'wild'] },
  { emoji: '🦁', name: 'Lion Face', category: 'animals', keywords: ['lion', 'animal', 'wild'] },
  { emoji: '🐮', name: 'Cow Face', category: 'animals', keywords: ['cow', 'farm', 'milk'] },
  { emoji: '🐷', name: 'Pig Face', category: 'animals', keywords: ['pig', 'farm', 'animal'] },
  { emoji: '🐽', name: 'Pig Nose', category: 'animals', keywords: ['pig', 'nose', 'snout'] },
  { emoji: '🐸', name: 'Frog Face', category: 'animals', keywords: ['frog', 'animal', 'amphibian'] },
  { emoji: '🐵', name: 'Monkey Face', category: 'animals', keywords: ['monkey', 'animal', 'primate'] },
  { emoji: '🙈', name: 'See-No-Evil Monkey', category: 'animals', keywords: ['monkey', 'see', 'evil'] },
  { emoji: '🙉', name: 'Hear-No-Evil Monkey', category: 'animals', keywords: ['monkey', 'hear', 'evil'] },
  { emoji: '🙊', name: 'Speak-No-Evil Monkey', category: 'animals', keywords: ['monkey', 'speak', 'evil'] },
  { emoji: '🐒', name: 'Monkey', category: 'animals', keywords: ['monkey', 'animal', 'banana'] },
  { emoji: '🦍', name: 'Gorilla', category: 'animals', keywords: ['gorilla', 'ape', 'strong'] },
  { emoji: '🦧', name: 'Orangutan', category: 'animals', keywords: ['orangutan', 'ape', 'red'] },
  { emoji: '🐺', name: 'Wolf Face', category: 'animals', keywords: ['wolf', 'wild', 'howl'] },
  { emoji: '🐗', name: 'Boar', category: 'animals', keywords: ['boar', 'pig', 'wild'] },
  { emoji: '🐴', name: 'Horse Face', category: 'animals', keywords: ['horse', 'animal', 'ride'] },
  { emoji: '🦄', name: 'Unicorn Face', category: 'animals', keywords: ['unicorn', 'magical', 'fantasy'] },
  { emoji: '🦓', name: 'Zebra', category: 'animals', keywords: ['zebra', 'stripe', 'africa'] },
  { emoji: '🦌', name: 'Deer', category: 'animals', keywords: ['deer', 'animal', 'forest'] },
  { emoji: '🦬', name: 'Bison', category: 'animals', keywords: ['bison', 'buffalo', 'wild'] },
  { emoji: '🐄', name: 'Cow', category: 'animals', keywords: ['cow', 'farm', 'moo'] },
  { emoji: '🐂', name: 'Ox', category: 'animals', keywords: ['ox', 'bull', 'strong'] },
  { emoji: '🐃', name: 'Water Buffalo', category: 'animals', keywords: ['buffalo', 'water', 'asia'] },
  { emoji: '🐎', name: 'Racing Horse', category: 'animals', keywords: ['horse', 'racing', 'fast'] },
  { emoji: '🫏', name: 'Donkey', category: 'animals', keywords: ['donkey', 'ass', 'stubborn'] },
  { emoji: '🐑', name: 'Ewe', category: 'animals', keywords: ['sheep', 'ewe', 'wool'] },
  { emoji: '🐏', name: 'Ram', category: 'animals', keywords: ['ram', 'sheep', 'horns'] },
  { emoji: '🐐', name: 'Goat', category: 'animals', keywords: ['goat', 'animal', 'horns'] },
  { emoji: '🐪', name: 'Dromedary Camel', category: 'animals', keywords: ['camel', 'desert', 'hump'] },
  { emoji: '🐫', name: 'Bactrian Camel', category: 'animals', keywords: ['camel', 'desert', 'humps'] },
  { emoji: '🦙', name: 'Llama', category: 'animals', keywords: ['llama', 'alpaca', 'fluffy'] },
  { emoji: '🦒', name: 'Giraffe', category: 'animals', keywords: ['giraffe', 'tall', 'neck'] },
  { emoji: '🐘', name: 'Elephant', category: 'animals', keywords: ['elephant', 'big', 'trunk'] },
  { emoji: '🦣', name: 'Mammoth', category: 'animals', keywords: ['mammoth', 'extinct', 'ice'] },
  { emoji: '🦏', name: 'Rhinoceros', category: 'animals', keywords: ['rhino', 'horn', 'thick'] },
  { emoji: '🦛', name: 'Hippopotamus', category: 'animals', keywords: ['hippo', 'water', 'big'] },
  { emoji: '🐀', name: 'Rat', category: 'animals', keywords: ['rat', 'rodent', 'pest'] },
  { emoji: '🐁', name: 'Mouse', category: 'animals', keywords: ['mouse', 'small', 'rodent'] },
  { emoji: '🐿️', name: 'Chipmunk', category: 'animals', keywords: ['chipmunk', 'squirrel', 'nuts'] },
  { emoji: '🦫', name: 'Beaver', category: 'animals', keywords: ['beaver', 'dam', 'wood'] },
  { emoji: '🦔', name: 'Hedgehog', category: 'animals', keywords: ['hedgehog', 'spikes', 'small'] },
  { emoji: '🦇', name: 'Bat', category: 'animals', keywords: ['bat', 'fly', 'night'] },
  { emoji: '🐇', name: 'Rabbit', category: 'animals', keywords: ['rabbit', 'bunny', 'hop'] },
  { emoji: '🐈', name: 'Cat', category: 'animals', keywords: ['cat', 'pet', 'meow'] },
  { emoji: '🐈‍⬛', name: 'Black Cat', category: 'animals', keywords: ['cat', 'black', 'lucky'] },
  { emoji: '🐩', name: 'Poodle', category: 'animals', keywords: ['poodle', 'dog', 'fancy'] },
  { emoji: '🐕', name: 'Dog', category: 'animals', keywords: ['dog', 'pet', 'loyal'] },
  { emoji: '🦮', name: 'Guide Dog', category: 'animals', keywords: ['guide', 'dog', 'service'] },
  { emoji: '🐕‍🦺', name: 'Service Dog', category: 'animals', keywords: ['service', 'dog', 'vest'] },

  // Food & Drink (40+ emojis)
  { emoji: '🍔', name: 'Hamburger', category: 'food', keywords: ['burger', 'food', 'meat'] },
  { emoji: '🍕', name: 'Pizza', category: 'food', keywords: ['pizza', 'food', 'slice'] },
  { emoji: '🌮', name: 'Taco', category: 'food', keywords: ['taco', 'food', 'mexican'] },
  { emoji: '🌯', name: 'Burrito', category: 'food', keywords: ['burrito', 'wrap', 'mexican'] },
  { emoji: '🥙', name: 'Stuffed Flatbread', category: 'food', keywords: ['flatbread', 'pita', 'middle'] },
  { emoji: '🧆', name: 'Falafel', category: 'food', keywords: ['falafel', 'chickpea', 'middle'] },
  { emoji: '🥚', name: 'Egg', category: 'food', keywords: ['egg', 'protein', 'breakfast'] },
  { emoji: '🍳', name: 'Cooking', category: 'food', keywords: ['cooking', 'egg', 'pan'] },
  { emoji: '🥞', name: 'Pancakes', category: 'food', keywords: ['pancakes', 'breakfast', 'syrup'] },
  { emoji: '🧇', name: 'Waffle', category: 'food', keywords: ['waffle', 'breakfast', 'syrup'] },
  { emoji: '🥓', name: 'Bacon', category: 'food', keywords: ['bacon', 'meat', 'breakfast'] },
  { emoji: '🍖', name: 'Meat on Bone', category: 'food', keywords: ['meat', 'bone', 'carnivore'] },
  { emoji: '🍗', name: 'Poultry Leg', category: 'food', keywords: ['chicken', 'leg', 'meat'] },
  { emoji: '🥩', name: 'Cut of Meat', category: 'food', keywords: ['steak', 'meat', 'red'] },
  { emoji: '🥨', name: 'Pretzel', category: 'food', keywords: ['pretzel', 'salty', 'twisted'] },
  { emoji: '🥖', name: 'Baguette Bread', category: 'food', keywords: ['bread', 'french', 'long'] },
  { emoji: '🥐', name: 'Croissant', category: 'food', keywords: ['croissant', 'french', 'buttery'] },
  { emoji: '🍞', name: 'Bread', category: 'food', keywords: ['bread', 'loaf', 'wheat'] },
  { emoji: '🥯', name: 'Bagel', category: 'food', keywords: ['bagel', 'bread', 'round'] },
  { emoji: '🫓', name: 'Flatbread', category: 'food', keywords: ['flatbread', 'naan', 'bread'] },
  { emoji: '🧀', name: 'Cheese Wedge', category: 'food', keywords: ['cheese', 'dairy', 'yellow'] },
  { emoji: '🥗', name: 'Green Salad', category: 'food', keywords: ['salad', 'healthy', 'green'] },
  { emoji: '🥒', name: 'Cucumber', category: 'food', keywords: ['cucumber', 'green', 'vegetable'] },
  { emoji: '🌶️', name: 'Hot Pepper', category: 'food', keywords: ['pepper', 'hot', 'spicy'] },
  { emoji: '🫑', name: 'Bell Pepper', category: 'food', keywords: ['pepper', 'bell', 'vegetable'] },
  { emoji: '🌽', name: 'Ear of Corn', category: 'food', keywords: ['corn', 'yellow', 'vegetable'] },
  { emoji: '🥕', name: 'Carrot', category: 'food', keywords: ['carrot', 'orange', 'vegetable'] },
  { emoji: '🫒', name: 'Olive', category: 'food', keywords: ['olive', 'green', 'oil'] },
  { emoji: '🧄', name: 'Garlic', category: 'food', keywords: ['garlic', 'flavor', 'cooking'] },
  { emoji: '🧅', name: 'Onion', category: 'food', keywords: ['onion', 'cooking', 'cry'] },
  { emoji: '🍄', name: 'Mushroom', category: 'food', keywords: ['mushroom', 'fungi', 'cooking'] },
  { emoji: '🥜', name: 'Peanuts', category: 'food', keywords: ['peanuts', 'nuts', 'snack'] },
  { emoji: '🫘', name: 'Beans', category: 'food', keywords: ['beans', 'protein', 'legume'] },
  { emoji: '🌰', name: 'Chestnut', category: 'food', keywords: ['chestnut', 'nut', 'brown'] },
  { emoji: '🍞', name: 'Bread', category: 'food', keywords: ['bread', 'loaf', 'carbs'] },
  { emoji: '🥐', name: 'Croissant', category: 'food', keywords: ['croissant', 'pastry', 'french'] },
  { emoji: '🥖', name: 'Baguette', category: 'food', keywords: ['baguette', 'bread', 'french'] },
  { emoji: '🫓', name: 'Flatbread', category: 'food', keywords: ['flatbread', 'bread', 'thin'] },
  { emoji: '🥨', name: 'Pretzel', category: 'food', keywords: ['pretzel', 'twisted', 'salty'] },
  { emoji: '🥯', name: 'Bagel', category: 'food', keywords: ['bagel', 'bread', 'hole'] },
  { emoji: '🥞', name: 'Pancakes', category: 'food', keywords: ['pancakes', 'stack', 'syrup'] },
  { emoji: '🧇', name: 'Waffle', category: 'food', keywords: ['waffle', 'grid', 'syrup'] },
  { emoji: '🍰', name: 'Shortcake', category: 'food', keywords: ['cake', 'dessert', 'sweet'] },
  { emoji: '🎂', name: 'Birthday Cake', category: 'food', keywords: ['cake', 'birthday', 'candles'] },
  { emoji: '🧁', name: 'Cupcake', category: 'food', keywords: ['cupcake', 'dessert', 'frosting'] },
  { emoji: '🥧', name: 'Pie', category: 'food', keywords: ['pie', 'dessert', 'slice'] },
  { emoji: '🍮', name: 'Custard', category: 'food', keywords: ['custard', 'dessert', 'pudding'] },
  { emoji: '🍭', name: 'Lollipop', category: 'food', keywords: ['lollipop', 'candy', 'sweet'] },
  { emoji: '🍬', name: 'Candy', category: 'food', keywords: ['candy', 'sweet', 'wrapper'] },
  { emoji: '🍫', name: 'Chocolate Bar', category: 'food', keywords: ['chocolate', 'bar', 'sweet'] },
  { emoji: '🍿', name: 'Popcorn', category: 'food', keywords: ['popcorn', 'movie', 'snack'] },
  { emoji: '🍩', name: 'Doughnut', category: 'food', keywords: ['donut', 'sweet', 'fried'] },
  { emoji: '🍪', name: 'Cookie', category: 'food', keywords: ['cookie', 'sweet', 'baked'] },
  { emoji: '🌰', name: 'Chestnut', category: 'food', keywords: ['chestnut', 'roasted', 'fall'] },
  { emoji: '🥥', name: 'Coconut', category: 'food', keywords: ['coconut', 'tropical', 'milk'] },
  { emoji: '🥝', name: 'Kiwi Fruit', category: 'food', keywords: ['kiwi', 'green', 'fruit'] },
  { emoji: '🍓', name: 'Strawberry', category: 'food', keywords: ['strawberry', 'red', 'berry'] },
  { emoji: '🫐', name: 'Blueberries', category: 'food', keywords: ['blueberries', 'blue', 'berry'] },
  { emoji: '🍇', name: 'Grapes', category: 'food', keywords: ['grapes', 'wine', 'purple'] },
  { emoji: '🍉', name: 'Watermelon', category: 'food', keywords: ['watermelon', 'summer', 'red'] },
  { emoji: '🍑', name: 'Cherries', category: 'food', keywords: ['cherries', 'red', 'sweet'] },
  { emoji: '🍒', name: 'Cherry', category: 'food', keywords: ['cherry', 'red', 'pit'] },
  { emoji: '🍑', name: 'Peach', category: 'food', keywords: ['peach', 'fuzzy', 'sweet'] },
  { emoji: '🥭', name: 'Mango', category: 'food', keywords: ['mango', 'tropical', 'orange'] },
  { emoji: '🍍', name: 'Pineapple', category: 'food', keywords: ['pineapple', 'tropical', 'spiky'] },
  { emoji: '🍌', name: 'Banana', category: 'food', keywords: ['banana', 'yellow', 'potassium'] },
  { emoji: '🍋', name: 'Lemon', category: 'food', keywords: ['lemon', 'sour', 'yellow'] },
  { emoji: '🍊', name: 'Orange', category: 'food', keywords: ['orange', 'citrus', 'vitamin'] },
  { emoji: '🍎', name: 'Red Apple', category: 'food', keywords: ['apple', 'red', 'fruit'] },
  { emoji: '🍏', name: 'Green Apple', category: 'food', keywords: ['apple', 'green', 'sour'] },
  { emoji: '🍐', name: 'Pear', category: 'food', keywords: ['pear', 'green', 'fruit'] },
  { emoji: '🫒', name: 'Olive', category: 'food', keywords: ['olive', 'green', 'mediterranean'] },
  { emoji: '🥑', name: 'Avocado', category: 'food', keywords: ['avocado', 'green', 'healthy'] },
  { emoji: '🍆', name: 'Eggplant', category: 'food', keywords: ['eggplant', 'purple', 'vegetable'] },
  { emoji: '🥔', name: 'Potato', category: 'food', keywords: ['potato', 'brown', 'starch'] },
  { emoji: '🥖', name: 'Baguette', category: 'food', keywords: ['bread', 'french', 'long'] },
  { emoji: '🥘', name: 'Shallow Pan of Food', category: 'food', keywords: ['paella', 'pan', 'rice'] },
  { emoji: '🍳', name: 'Cooking', category: 'food', keywords: ['frying', 'pan', 'egg'] },
  { emoji: '🥘', name: 'Paella', category: 'food', keywords: ['paella', 'spanish', 'rice'] },
  { emoji: '🍲', name: 'Pot of Food', category: 'food', keywords: ['pot', 'stew', 'soup'] },
  { emoji: '🫕', name: 'Fondue', category: 'food', keywords: ['fondue', 'cheese', 'pot'] },
  { emoji: '🥣', name: 'Bowl with Spoon', category: 'food', keywords: ['bowl', 'cereal', 'soup'] },
  { emoji: '🥗', name: 'Green Salad', category: 'food', keywords: ['salad', 'healthy', 'vegetables'] },
  { emoji: '🍿', name: 'Popcorn', category: 'food', keywords: ['popcorn', 'movies', 'kernels'] },
  { emoji: '🧈', name: 'Butter', category: 'food', keywords: ['butter', 'dairy', 'spread'] },
  { emoji: '🧂', name: 'Salt', category: 'food', keywords: ['salt', 'seasoning', 'white'] },
  { emoji: '🥫', name: 'Canned Food', category: 'food', keywords: ['can', 'preserved', 'food'] },

  // Travel & Places (30+ emojis)
  { emoji: '✈️', name: 'Airplane', category: 'travel', keywords: ['airplane', 'travel', 'flight'] },
  { emoji: '🚗', name: 'Car', category: 'travel', keywords: ['car', 'vehicle', 'drive'] },
  { emoji: '🚕', name: 'Taxi', category: 'travel', keywords: ['taxi', 'cab', 'yellow'] },
  { emoji: '🚙', name: 'SUV', category: 'travel', keywords: ['suv', 'car', 'vehicle'] },
  { emoji: '🚌', name: 'Bus', category: 'travel', keywords: ['bus', 'public', 'transport'] },
  { emoji: '🚎', name: 'Trolleybus', category: 'travel', keywords: ['trolley', 'bus', 'electric'] },
  { emoji: '🏎️', name: 'Racing Car', category: 'travel', keywords: ['racing', 'car', 'fast'] },
  { emoji: '🚓', name: 'Police Car', category: 'travel', keywords: ['police', 'car', 'law'] },
  { emoji: '🚑', name: 'Ambulance', category: 'travel', keywords: ['ambulance', 'medical', 'emergency'] },
  { emoji: '🚒', name: 'Fire Engine', category: 'travel', keywords: ['fire', 'truck', 'emergency'] },
  { emoji: '🚐', name: 'Minibus', category: 'travel', keywords: ['minibus', 'van', 'transport'] },
  { emoji: '🛻', name: 'Pickup Truck', category: 'travel', keywords: ['pickup', 'truck', 'work'] },
  { emoji: '🚚', name: 'Delivery Truck', category: 'travel', keywords: ['truck', 'delivery', 'cargo'] },
  { emoji: '🚛', name: 'Articulated Lorry', category: 'travel', keywords: ['truck', 'semi', 'big'] },
  { emoji: '🚜', name: 'Tractor', category: 'travel', keywords: ['tractor', 'farm', 'agriculture'] },
  { emoji: '🏍️', name: 'Motorcycle', category: 'travel', keywords: ['motorcycle', 'bike', 'fast'] },
  { emoji: '🛵', name: 'Motor Scooter', category: 'travel', keywords: ['scooter', 'moped', 'city'] },
  { emoji: '🚲', name: 'Bicycle', category: 'travel', keywords: ['bicycle', 'bike', 'pedal'] },
  { emoji: '🛴', name: 'Kick Scooter', category: 'travel', keywords: ['scooter', 'kick', 'ride'] },
  { emoji: '🛹', name: 'Skateboard', category: 'travel', keywords: ['skateboard', 'skate', 'wheels'] },
  { emoji: '🛼', name: 'Roller Skate', category: 'travel', keywords: ['roller', 'skate', 'wheels'] },
  { emoji: '🚁', name: 'Helicopter', category: 'travel', keywords: ['helicopter', 'chopper', 'fly'] },
  { emoji: '🛩️', name: 'Small Airplane', category: 'travel', keywords: ['airplane', 'small', 'plane'] },
  { emoji: '🛫', name: 'Airplane Departure', category: 'travel', keywords: ['departure', 'takeoff', 'travel'] },
  { emoji: '🛬', name: 'Airplane Arrival', category: 'travel', keywords: ['arrival', 'landing', 'travel'] },
  { emoji: '🪂', name: 'Parachute', category: 'travel', keywords: ['parachute', 'skydive', 'fall'] },
  { emoji: '💺', name: 'Seat', category: 'travel', keywords: ['seat', 'airplane', 'chair'] },
  { emoji: '🚀', name: 'Rocket', category: 'travel', keywords: ['rocket', 'space', 'launch'] },
  { emoji: '🛸', name: 'Flying Saucer', category: 'travel', keywords: ['ufo', 'alien', 'space'] },
  { emoji: '🚉', name: 'Station', category: 'travel', keywords: ['station', 'train', 'platform'] },
  { emoji: '🚞', name: 'Mountain Railway', category: 'travel', keywords: ['mountain', 'railway', 'train'] },
  { emoji: '🚝', name: 'Monorail', category: 'travel', keywords: ['monorail', 'train', 'single'] },
  { emoji: '🚄', name: 'High-Speed Train', category: 'travel', keywords: ['bullet', 'train', 'fast'] },
  { emoji: '🚅', name: 'Bullet Train', category: 'travel', keywords: ['bullet', 'train', 'speed'] },
  { emoji: '🚈', name: 'Light Rail', category: 'travel', keywords: ['light', 'rail', 'metro'] },
  { emoji: '🚂', name: 'Locomotive', category: 'travel', keywords: ['locomotive', 'train', 'steam'] },
  { emoji: '🚆', name: 'Train', category: 'travel', keywords: ['train', 'railway', 'transport'] },
  { emoji: '🚇', name: 'Metro', category: 'travel', keywords: ['metro', 'subway', 'underground'] },
  { emoji: '🚊', name: 'Tram', category: 'travel', keywords: ['tram', 'streetcar', 'rail'] },
  { emoji: '🚋', name: 'Tram Car', category: 'travel', keywords: ['tram', 'car', 'rail'] },
  { emoji: '🚃', name: 'Railway Car', category: 'travel', keywords: ['railway', 'car', 'train'] },
  { emoji: '🚋', name: 'Tram', category: 'travel', keywords: ['tram', 'public', 'transport'] },
  { emoji: '🚎', name: 'Trolleybus', category: 'travel', keywords: ['trolley', 'electric', 'bus'] },
  { emoji: '🏔️', name: 'Snow-Capped Mountain', category: 'travel', keywords: ['mountain', 'snow', 'peak'] },
  { emoji: '⛰️', name: 'Mountain', category: 'travel', keywords: ['mountain', 'hill', 'nature'] },
  { emoji: '🌋', name: 'Volcano', category: 'travel', keywords: ['volcano', 'lava', 'eruption'] },
  { emoji: '🗻', name: 'Mount Fuji', category: 'travel', keywords: ['fuji', 'mountain', 'japan'] },
  { emoji: '🏕️', name: 'Camping', category: 'travel', keywords: ['camping', 'tent', 'outdoor'] },
  { emoji: '🏖️', name: 'Beach with Umbrella', category: 'travel', keywords: ['beach', 'umbrella', 'sand'] },
  { emoji: '🏜️', name: 'Desert', category: 'travel', keywords: ['desert', 'sand', 'dry'] },
  { emoji: '🏝️', name: 'Desert Island', category: 'travel', keywords: ['island', 'tropical', 'palm'] },
  { emoji: '🏞️', name: 'National Park', category: 'travel', keywords: ['park', 'nature', 'outdoors'] },

  // Activities (30+ emojis)
  { emoji: '⚽', name: 'Soccer Ball', category: 'activities', keywords: ['soccer', 'football', 'ball'] },
  { emoji: '🏀', name: 'Basketball', category: 'activities', keywords: ['basketball', 'ball', 'sport'] },
  { emoji: '🏈', name: 'American Football', category: 'activities', keywords: ['football', 'american', 'nfl'] },
  { emoji: '⚾', name: 'Baseball', category: 'activities', keywords: ['baseball', 'ball', 'sport'] },
  { emoji: '🥎', name: 'Softball', category: 'activities', keywords: ['softball', 'ball', 'sport'] },
  { emoji: '🎾', name: 'Tennis', category: 'activities', keywords: ['tennis', 'ball', 'racket'] },
  { emoji: '🏐', name: 'Volleyball', category: 'activities', keywords: ['volleyball', 'ball', 'net'] },
  { emoji: '🏉', name: 'Rugby Football', category: 'activities', keywords: ['rugby', 'ball', 'sport'] },
  { emoji: '🥏', name: 'Flying Disc', category: 'activities', keywords: ['frisbee', 'disc', 'throw'] },
  { emoji: '🎱', name: 'Pool 8 Ball', category: 'activities', keywords: ['pool', 'billiards', 'eight'] },
  { emoji: '🪀', name: 'Yo-Yo', category: 'activities', keywords: ['yoyo', 'toy', 'string'] },
  { emoji: '🏓', name: 'Ping Pong', category: 'activities', keywords: ['ping', 'pong', 'table'] },
  { emoji: '🏸', name: 'Badminton', category: 'activities', keywords: ['badminton', 'racket', 'shuttlecock'] },
  { emoji: '🥅', name: 'Goal Net', category: 'activities', keywords: ['goal', 'net', 'soccer'] },
  { emoji: '⛳', name: 'Flag in Hole', category: 'activities', keywords: ['golf', 'flag', 'hole'] },
  { emoji: '🪁', name: 'Kite', category: 'activities', keywords: ['kite', 'fly', 'wind'] },
  { emoji: '🛝', name: 'Playground Slide', category: 'activities', keywords: ['slide', 'playground', 'kids'] },
  { emoji: '🏹', name: 'Bow and Arrow', category: 'activities', keywords: ['bow', 'arrow', 'archery'] },
  { emoji: '🎣', name: 'Fishing Pole', category: 'activities', keywords: ['fishing', 'pole', 'catch'] },
  { emoji: '🤿', name: 'Diving Mask', category: 'activities', keywords: ['diving', 'snorkel', 'underwater'] },
  { emoji: '🥊', name: 'Boxing Glove', category: 'activities', keywords: ['boxing', 'glove', 'fight'] },
  { emoji: '🥋', name: 'Martial Arts Uniform', category: 'activities', keywords: ['karate', 'judo', 'martial'] },
  { emoji: '🎽', name: 'Running Shirt', category: 'activities', keywords: ['running', 'shirt', 'marathon'] },
  { emoji: '🛹', name: 'Skateboard', category: 'activities', keywords: ['skateboard', 'skate', 'board'] },
  { emoji: '🛷', name: 'Sled', category: 'activities', keywords: ['sled', 'snow', 'winter'] },
  { emoji: '⛸️', name: 'Ice Skate', category: 'activities', keywords: ['ice', 'skate', 'winter'] },
  { emoji: '🥌', name: 'Curling Stone', category: 'activities', keywords: ['curling', 'stone', 'ice'] },
  { emoji: '🎿', name: 'Skis', category: 'activities', keywords: ['ski', 'snow', 'winter'] },
  { emoji: '⛷️', name: 'Skier', category: 'activities', keywords: ['skier', 'skiing', 'snow'] },
  { emoji: '🏂', name: 'Snowboarder', category: 'activities', keywords: ['snowboard', 'snow', 'winter'] },
  { emoji: '🪂', name: 'Parachute', category: 'activities', keywords: ['parachute', 'skydiving', 'air'] },
  { emoji: '🏋️', name: 'Weight Lifter', category: 'activities', keywords: ['weightlifting', 'gym', 'strong'] },
  { emoji: '🤼', name: 'Wrestlers', category: 'activities', keywords: ['wrestling', 'grapple', 'sport'] },
  { emoji: '🤸', name: 'Cartwheel', category: 'activities', keywords: ['cartwheel', 'gymnastics', 'flip'] },
  { emoji: '⛹️', name: 'Bouncing Ball', category: 'activities', keywords: ['basketball', 'dribble', 'bounce'] },
  { emoji: '🤾', name: 'Handball', category: 'activities', keywords: ['handball', 'ball', 'throw'] },
  { emoji: '🏌️', name: 'Golfer', category: 'activities', keywords: ['golf', 'golfer', 'swing'] },
  { emoji: '🏇', name: 'Horse Racing', category: 'activities', keywords: ['horse', 'racing', 'jockey'] },
  { emoji: '🧘', name: 'Lotus Position', category: 'activities', keywords: ['yoga', 'meditation', 'zen'] },
  { emoji: '🏄', name: 'Surfer', category: 'activities', keywords: ['surf', 'wave', 'ocean'] },
  { emoji: '🏊', name: 'Swimmer', category: 'activities', keywords: ['swim', 'pool', 'water'] },
  { emoji: '🤽', name: 'Water Polo', category: 'activities', keywords: ['water', 'polo', 'ball'] },
  { emoji: '🚣', name: 'Rowboat', category: 'activities', keywords: ['row', 'boat', 'water'] },
  { emoji: '🧗', name: 'Climber', category: 'activities', keywords: ['climb', 'rock', 'mountain'] },
  { emoji: '🚵', name: 'Mountain Biker', category: 'activities', keywords: ['mountain', 'bike', 'cycling'] },
  { emoji: '🚴', name: 'Biker', category: 'activities', keywords: ['bike', 'cycling', 'pedal'] },
  { emoji: '🏆', name: 'Trophy', category: 'activities', keywords: ['trophy', 'winner', 'award'] },
  { emoji: '🥇', name: 'Gold Medal', category: 'activities', keywords: ['gold', 'medal', 'first'] },
  { emoji: '🥈', name: 'Silver Medal', category: 'activities', keywords: ['silver', 'medal', 'second'] },
  { emoji: '🥉', name: 'Bronze Medal', category: 'activities', keywords: ['bronze', 'medal', 'third'] },
  { emoji: '🏅', name: 'Sports Medal', category: 'activities', keywords: ['medal', 'sports', 'achievement'] },
  { emoji: '🎖️', name: 'Military Medal', category: 'activities', keywords: ['military', 'medal', 'honor'] },
  { emoji: '🏵️', name: 'Rosette', category: 'activities', keywords: ['rosette', 'flower', 'award'] },
  { emoji: '🎗️', name: 'Reminder Ribbon', category: 'activities', keywords: ['ribbon', 'awareness', 'cause'] },
  { emoji: '🎫', name: 'Ticket', category: 'activities', keywords: ['ticket', 'event', 'admission'] },
  { emoji: '🎟️', name: 'Admission Tickets', category: 'activities', keywords: ['tickets', 'admission', 'event'] },
  { emoji: '🎪', name: 'Circus Tent', category: 'activities', keywords: ['circus', 'tent', 'entertainment'] },
  { emoji: '🤹', name: 'Juggler', category: 'activities', keywords: ['juggle', 'balls', 'skill'] },
  { emoji: '🎭', name: 'Performing Arts', category: 'activities', keywords: ['theater', 'drama', 'masks'] },
  { emoji: '🩰', name: 'Ballet Shoes', category: 'activities', keywords: ['ballet', 'dance', 'shoes'] },
  { emoji: '🎨', name: 'Artist Palette', category: 'activities', keywords: ['art', 'paint', 'creative'] },
  { emoji: '🎬', name: 'Clapper Board', category: 'activities', keywords: ['movie', 'film', 'action'] },
  { emoji: '🎤', name: 'Microphone', category: 'activities', keywords: ['mic', 'sing', 'karaoke'] },
  { emoji: '🎧', name: 'Headphone', category: 'activities', keywords: ['headphones', 'music', 'listen'] },
  { emoji: '🎼', name: 'Musical Score', category: 'activities', keywords: ['music', 'notes', 'sheet'] },
  { emoji: '🎵', name: 'Musical Note', category: 'activities', keywords: ['music', 'note', 'sound'] },
  { emoji: '🎶', name: 'Musical Notes', category: 'activities', keywords: ['music', 'notes', 'melody'] },
  { emoji: '🎹', name: 'Musical Keyboard', category: 'activities', keywords: ['piano', 'keyboard', 'music'] },
  { emoji: '🥁', name: 'Drum', category: 'activities', keywords: ['drum', 'beat', 'percussion'] },
  { emoji: '🪘', name: 'Long Drum', category: 'activities', keywords: ['drum', 'long', 'beat'] },
  { emoji: '🎷', name: 'Saxophone', category: 'activities', keywords: ['saxophone', 'jazz', 'music'] },
  { emoji: '🎺', name: 'Trumpet', category: 'activities', keywords: ['trumpet', 'brass', 'music'] },
  { emoji: '🎸', name: 'Guitar', category: 'activities', keywords: ['guitar', 'rock', 'music'] },
  { emoji: '🪕', name: 'Banjo', category: 'activities', keywords: ['banjo', 'country', 'music'] },
  { emoji: '🎻', name: 'Violin', category: 'activities', keywords: ['violin', 'classical', 'music'] },
  { emoji: '🎲', name: 'Game Die', category: 'activities', keywords: ['dice', 'game', 'random'] },
  { emoji: '♟️', name: 'Chess Pawn', category: 'activities', keywords: ['chess', 'pawn', 'strategy'] },
  { emoji: '🎯', name: 'Bullseye', category: 'activities', keywords: ['target', 'bullseye', 'aim'] },
  { emoji: '🎳', name: 'Bowling', category: 'activities', keywords: ['bowling', 'pins', 'strike'] },
  { emoji: '🎮', name: 'Video Game', category: 'activities', keywords: ['video', 'game', 'controller'] },
  { emoji: '🕹️', name: 'Joystick', category: 'activities', keywords: ['joystick', 'arcade', 'game'] },
  { emoji: '🎰', name: 'Slot Machine', category: 'activities', keywords: ['slot', 'machine', 'casino'] },
  { emoji: '🧩', name: 'Puzzle Piece', category: 'activities', keywords: ['puzzle', 'piece', 'solve'] },

  // Objects (40+ emojis)
  { emoji: '💡', name: 'Light Bulb', category: 'objects', keywords: ['bulb', 'light', 'idea'] },
  { emoji: '🔦', name: 'Flashlight', category: 'objects', keywords: ['flashlight', 'torch', 'light'] },
  { emoji: '🕯️', name: 'Candle', category: 'objects', keywords: ['candle', 'flame', 'wax'] },
  { emoji: '🪔', name: 'Diya Lamp', category: 'objects', keywords: ['diya', 'lamp', 'oil'] },
  { emoji: '🔥', name: 'Fire', category: 'objects', keywords: ['fire', 'flame', 'hot'] },
  { emoji: '🧯', name: 'Fire Extinguisher', category: 'objects', keywords: ['extinguisher', 'fire', 'safety'] },
  { emoji: '🛢️', name: 'Oil Drum', category: 'objects', keywords: ['oil', 'drum', 'barrel'] },
  { emoji: '💸', name: 'Money with Wings', category: 'objects', keywords: ['money', 'fly', 'expensive'] },
  { emoji: '💴', name: 'Yen Banknote', category: 'objects', keywords: ['yen', 'money', 'japan'] },
  { emoji: '💵', name: 'Dollar Banknote', category: 'objects', keywords: ['dollar', 'money', 'cash'] },
  { emoji: '💶', name: 'Euro Banknote', category: 'objects', keywords: ['euro', 'money', 'europe'] },
  { emoji: '💷', name: 'Pound Banknote', category: 'objects', keywords: ['pound', 'money', 'uk'] },
  { emoji: '🪙', name: 'Coin', category: 'objects', keywords: ['coin', 'money', 'change'] },
  { emoji: '💰', name: 'Money Bag', category: 'objects', keywords: ['money', 'bag', 'rich'] },
  { emoji: '💳', name: 'Credit Card', category: 'objects', keywords: ['credit', 'card', 'payment'] },
  { emoji: '💎', name: 'Gem Stone', category: 'objects', keywords: ['diamond', 'gem', 'precious'] },
  { emoji: '⚖️', name: 'Balance Scale', category: 'objects', keywords: ['scale', 'justice', 'balance'] },
  { emoji: '🪜', name: 'Ladder', category: 'objects', keywords: ['ladder', 'climb', 'steps'] },
  { emoji: '🧰', name: 'Toolbox', category: 'objects', keywords: ['toolbox', 'tools', 'repair'] },
  { emoji: '🔧', name: 'Wrench', category: 'objects', keywords: ['wrench', 'tool', 'fix'] },
  { emoji: '🔨', name: 'Hammer', category: 'objects', keywords: ['hammer', 'tool', 'nail'] },
  { emoji: '⚒️', name: 'Hammer and Pick', category: 'objects', keywords: ['hammer', 'pick', 'tools'] },
  { emoji: '🛠️', name: 'Hammer and Wrench', category: 'objects', keywords: ['tools', 'repair', 'fix'] },
  { emoji: '⛏️', name: 'Pick', category: 'objects', keywords: ['pick', 'mining', 'tool'] },
  { emoji: '🪚', name: 'Carpentry Saw', category: 'objects', keywords: ['saw', 'cut', 'wood'] },
  { emoji: '🔩', name: 'Nut and Bolt', category: 'objects', keywords: ['nut', 'bolt', 'screw'] },
  { emoji: '⚙️', name: 'Gear', category: 'objects', keywords: ['gear', 'settings', 'mechanical'] },
  { emoji: '🪤', name: 'Mouse Trap', category: 'objects', keywords: ['trap', 'mouse', 'catch'] },
  { emoji: '🧲', name: 'Magnet', category: 'objects', keywords: ['magnet', 'attract', 'metal'] },
  { emoji: '🪣', name: 'Bucket', category: 'objects', keywords: ['bucket', 'pail', 'water'] },
  { emoji: '🧴', name: 'Lotion Bottle', category: 'objects', keywords: ['bottle', 'lotion', 'pump'] },
  { emoji: '🧷', name: 'Safety Pin', category: 'objects', keywords: ['pin', 'safety', 'attach'] },
  { emoji: '🧹', name: 'Broom', category: 'objects', keywords: ['broom', 'sweep', 'clean'] },
  { emoji: '🧺', name: 'Basket', category: 'objects', keywords: ['basket', 'wicker', 'carry'] },
  { emoji: '🧻', name: 'Roll of Paper', category: 'objects', keywords: ['toilet', 'paper', 'roll'] },
  { emoji: '🪒', name: 'Razor', category: 'objects', keywords: ['razor', 'shave', 'blade'] },
  { emoji: '🧼', name: 'Soap', category: 'objects', keywords: ['soap', 'clean', 'wash'] },
  { emoji: '🫧', name: 'Bubbles', category: 'objects', keywords: ['bubbles', 'soap', 'clean'] },
  { emoji: '🪥', name: 'Toothbrush', category: 'objects', keywords: ['toothbrush', 'dental', 'clean'] },
  { emoji: '🧽', name: 'Sponge', category: 'objects', keywords: ['sponge', 'clean', 'scrub'] },
  { emoji: '🧴', name: 'Bottle', category: 'objects', keywords: ['bottle', 'container', 'liquid'] },
  { emoji: '🛁', name: 'Bathtub', category: 'objects', keywords: ['bathtub', 'bath', 'clean'] },
  { emoji: '🪞', name: 'Mirror', category: 'objects', keywords: ['mirror', 'reflection', 'look'] },
  { emoji: '🚪', name: 'Door', category: 'objects', keywords: ['door', 'entrance', 'exit'] },
  { emoji: '🪑', name: 'Chair', category: 'objects', keywords: ['chair', 'seat', 'furniture'] },
  { emoji: '🛏️', name: 'Bed', category: 'objects', keywords: ['bed', 'sleep', 'rest'] },
  { emoji: '🛋️', name: 'Couch and Lamp', category: 'objects', keywords: ['couch', 'sofa', 'furniture'] },
  { emoji: '🪭', name: 'Folding Hand Fan', category: 'objects', keywords: ['fan', 'cool', 'air'] },
  { emoji: '🔑', name: 'Key', category: 'objects', keywords: ['key', 'lock', 'open'] },
  { emoji: '🗝️', name: 'Old Key', category: 'objects', keywords: ['old', 'key', 'antique'] },
  { emoji: '🔨', name: 'Hammer', category: 'objects', keywords: ['hammer', 'tool', 'build'] },
  { emoji: '🪓', name: 'Axe', category: 'objects', keywords: ['axe', 'chop', 'wood'] },
  { emoji: '🔪', name: 'Kitchen Knife', category: 'objects', keywords: ['knife', 'cut', 'sharp'] },
  { emoji: '🗡️', name: 'Dagger', category: 'objects', keywords: ['dagger', 'sword', 'blade'] },
  { emoji: '⚔️', name: 'Crossed Swords', category: 'objects', keywords: ['swords', 'crossed', 'battle'] },
  { emoji: '🔫', name: 'Water Pistol', category: 'objects', keywords: ['pistol', 'water', 'toy'] },
  { emoji: '🪃', name: 'Boomerang', category: 'objects', keywords: ['boomerang', 'return', 'throw'] },
  { emoji: '🏹', name: 'Bow and Arrow', category: 'objects', keywords: ['bow', 'arrow', 'archery'] },
  { emoji: '🛡️', name: 'Shield', category: 'objects', keywords: ['shield', 'protection', 'defend'] },
  { emoji: '🪚', name: 'Saw', category: 'objects', keywords: ['saw', 'cut', 'tool'] },
  { emoji: '🔧', name: 'Wrench', category: 'objects', keywords: ['wrench', 'tool', 'mechanic'] },
  { emoji: '🪛', name: 'Screwdriver', category: 'objects', keywords: ['screwdriver', 'screw', 'tool'] },
  { emoji: '🔩', name: 'Nut and Bolt', category: 'objects', keywords: ['nut', 'bolt', 'hardware'] },
  { emoji: '⚙️', name: 'Gear', category: 'objects', keywords: ['gear', 'cog', 'machine'] },
  { emoji: '🗜️', name: 'Clamp', category: 'objects', keywords: ['clamp', 'vise', 'squeeze'] },
  { emoji: '⚗️', name: 'Alembic', category: 'objects', keywords: ['alembic', 'chemistry', 'distill'] },
  { emoji: '⚖️', name: 'Balance Scale', category: 'objects', keywords: ['scale', 'balance', 'weigh'] },
  { emoji: '🦯', name: 'Probing Cane', category: 'objects', keywords: ['cane', 'blind', 'walk'] },
  { emoji: '🔗', name: 'Link', category: 'objects', keywords: ['link', 'chain', 'connect'] },
  { emoji: '⛓️', name: 'Chains', category: 'objects', keywords: ['chains', 'metal', 'bind'] },
  { emoji: '🪝', name: 'Hook', category: 'objects', keywords: ['hook', 'hang', 'catch'] },
  { emoji: '🧷', name: 'Safety Pin', category: 'objects', keywords: ['safety', 'pin', 'fasten'] },
  { emoji: '📎', name: 'Paperclip', category: 'objects', keywords: ['paperclip', 'clip', 'attach'] },
  { emoji: '🖇️', name: 'Linked Paperclips', category: 'objects', keywords: ['paperclips', 'linked', 'chain'] },
  { emoji: '📏', name: 'Straight Ruler', category: 'objects', keywords: ['ruler', 'measure', 'straight'] },
  { emoji: '📐', name: 'Triangular Ruler', category: 'objects', keywords: ['ruler', 'triangle', 'angle'] },
  { emoji: '✂️', name: 'Scissors', category: 'objects', keywords: ['scissors', 'cut', 'sharp'] },
  { emoji: '🗃️', name: 'Card File Box', category: 'objects', keywords: ['file', 'box', 'organize'] },
  { emoji: '🗄️', name: 'File Cabinet', category: 'objects', keywords: ['cabinet', 'file', 'storage'] },
  { emoji: '🗑️', name: 'Wastebasket', category: 'objects', keywords: ['trash', 'waste', 'bin'] },
  { emoji: '🔒', name: 'Locked', category: 'objects', keywords: ['locked', 'secure', 'private'] },
  { emoji: '🔓', name: 'Unlocked', category: 'objects', keywords: ['unlocked', 'open', 'access'] },
  { emoji: '🔏', name: 'Locked with Pen', category: 'objects', keywords: ['locked', 'pen', 'secure'] },
  { emoji: '🔐', name: 'Locked with Key', category: 'objects', keywords: ['locked', 'key', 'secure'] },
  { emoji: '🔑', name: 'Key', category: 'objects', keywords: ['key', 'unlock', 'access'] },
  { emoji: '🗝️', name: 'Old Key', category: 'objects', keywords: ['old', 'key', 'vintage'] },

  // Symbols (40+ emojis)
  { emoji: '❤️', name: 'Red Heart', category: 'symbols', keywords: ['heart', 'love', 'like'] },
  { emoji: '🧡', name: 'Orange Heart', category: 'symbols', keywords: ['orange', 'heart', 'love'] },
  { emoji: '💛', name: 'Yellow Heart', category: 'symbols', keywords: ['yellow', 'heart', 'love'] },
  { emoji: '💚', name: 'Green Heart', category: 'symbols', keywords: ['green', 'heart', 'love'] },
  { emoji: '💙', name: 'Blue Heart', category: 'symbols', keywords: ['blue', 'heart', 'love'] },
  { emoji: '💜', name: 'Purple Heart', category: 'symbols', keywords: ['purple', 'heart', 'love'] },
  { emoji: '🤎', name: 'Brown Heart', category: 'symbols', keywords: ['brown', 'heart', 'love'] },
  { emoji: '🖤', name: 'Black Heart', category: 'symbols', keywords: ['black', 'heart', 'dark'] },
  { emoji: '🩶', name: 'Grey Heart', category: 'symbols', keywords: ['grey', 'heart', 'neutral'] },
  { emoji: '🤍', name: 'White Heart', category: 'symbols', keywords: ['white', 'heart', 'pure'] },
  { emoji: '🩷', name: 'Pink Heart', category: 'symbols', keywords: ['pink', 'heart', 'love'] },
  { emoji: '💔', name: 'Broken Heart', category: 'symbols', keywords: ['broken', 'heart', 'sad'] },
  { emoji: '❣️', name: 'Heart Exclamation', category: 'symbols', keywords: ['heart', 'exclamation', 'love'] },
  { emoji: '💕', name: 'Two Hearts', category: 'symbols', keywords: ['two', 'hearts', 'love'] },
  { emoji: '💞', name: 'Revolving Hearts', category: 'symbols', keywords: ['revolving', 'hearts', 'love'] },
  { emoji: '💓', name: 'Beating Heart', category: 'symbols', keywords: ['beating', 'heart', 'love'] },
  { emoji: '💗', name: 'Growing Heart', category: 'symbols', keywords: ['growing', 'heart', 'love'] },
  { emoji: '💖', name: 'Sparkling Heart', category: 'symbols', keywords: ['sparkling', 'heart', 'love'] },
  { emoji: '💘', name: 'Heart with Arrow', category: 'symbols', keywords: ['heart', 'arrow', 'cupid'] },
  { emoji: '💝', name: 'Heart with Ribbon', category: 'symbols', keywords: ['heart', 'ribbon', 'gift'] },
  { emoji: '💟', name: 'Heart Decoration', category: 'symbols', keywords: ['heart', 'decoration', 'love'] },
  { emoji: '☮️', name: 'Peace Symbol', category: 'symbols', keywords: ['peace', 'symbol', 'harmony'] },
  { emoji: '✝️', name: 'Latin Cross', category: 'symbols', keywords: ['cross', 'christian', 'religion'] },
  { emoji: '☪️', name: 'Star and Crescent', category: 'symbols', keywords: ['star', 'crescent', 'islam'] },
  { emoji: '🕉️', name: 'Om', category: 'symbols', keywords: ['om', 'hindu', 'meditation'] },
  { emoji: '☸️', name: 'Wheel of Dharma', category: 'symbols', keywords: ['wheel', 'dharma', 'buddhism'] },
  { emoji: '✡️', name: 'Star of David', category: 'symbols', keywords: ['star', 'david', 'judaism'] },
  { emoji: '🔯', name: 'Dotted Six-Pointed Star', category: 'symbols', keywords: ['star', 'six', 'points'] },
  { emoji: '🕎', name: 'Menorah', category: 'symbols', keywords: ['menorah', 'jewish', 'candles'] },
  { emoji: '☯️', name: 'Yin Yang', category: 'symbols', keywords: ['yin', 'yang', 'balance'] },
  { emoji: '☦️', name: 'Orthodox Cross', category: 'symbols', keywords: ['orthodox', 'cross', 'christian'] },
  { emoji: '🛐', name: 'Place of Worship', category: 'symbols', keywords: ['worship', 'religion', 'pray'] },
  { emoji: '⛎', name: 'Ophiuchus', category: 'symbols', keywords: ['ophiuchus', 'zodiac', 'snake'] },
  { emoji: '♈', name: 'Aries', category: 'symbols', keywords: ['aries', 'zodiac', 'ram'] },
  { emoji: '♉', name: 'Taurus', category: 'symbols', keywords: ['taurus', 'zodiac', 'bull'] },
  { emoji: '♊', name: 'Gemini', category: 'symbols', keywords: ['gemini', 'zodiac', 'twins'] },
  { emoji: '♋', name: 'Cancer', category: 'symbols', keywords: ['cancer', 'zodiac', 'crab'] },
  { emoji: '♌', name: 'Leo', category: 'symbols', keywords: ['leo', 'zodiac', 'lion'] },
  { emoji: '♍', name: 'Virgo', category: 'symbols', keywords: ['virgo', 'zodiac', 'maiden'] },
  { emoji: '♎', name: 'Libra', category: 'symbols', keywords: ['libra', 'zodiac', 'scales'] },
  { emoji: '♏', name: 'Scorpio', category: 'symbols', keywords: ['scorpio', 'zodiac', 'scorpion'] },
  { emoji: '♐', name: 'Sagittarius', category: 'symbols', keywords: ['sagittarius', 'zodiac', 'archer'] },
  { emoji: '♑', name: 'Capricorn', category: 'symbols', keywords: ['capricorn', 'zodiac', 'goat'] },
  { emoji: '♒', name: 'Aquarius', category: 'symbols', keywords: ['aquarius', 'zodiac', 'water'] },
  { emoji: '♓', name: 'Pisces', category: 'symbols', keywords: ['pisces', 'zodiac', 'fish'] },
  { emoji: '🆔', name: 'ID Button', category: 'symbols', keywords: ['id', 'identity', 'card'] },
  { emoji: '⚛️', name: 'Atom Symbol', category: 'symbols', keywords: ['atom', 'science', 'physics'] },
  { emoji: '🉑', name: 'Japanese "Acceptable" Button', category: 'symbols', keywords: ['acceptable', 'japanese', 'ok'] },
  { emoji: '☢️', name: 'Radioactive', category: 'symbols', keywords: ['radioactive', 'nuclear', 'danger'] },
  { emoji: '☣️', name: 'Biohazard', category: 'symbols', keywords: ['biohazard', 'danger', 'toxic'] },
  { emoji: '📴', name: 'Mobile Phone Off', category: 'symbols', keywords: ['phone', 'off', 'silent'] },
  { emoji: '📳', name: 'Vibration Mode', category: 'symbols', keywords: ['vibration', 'silent', 'phone'] },
  { emoji: '🈶', name: 'Japanese "Not Free of Charge" Button', category: 'symbols', keywords: ['japanese', 'charge', 'fee'] },
  { emoji: '🈚', name: 'Japanese "Free of Charge" Button', category: 'symbols', keywords: ['japanese', 'free', 'no'] },
  { emoji: '🈸', name: 'Japanese "Application" Button', category: 'symbols', keywords: ['japanese', 'application', 'form'] },
  { emoji: '🈺', name: 'Japanese "Open for Business" Button', category: 'symbols', keywords: ['japanese', 'open', 'business'] },
  { emoji: '🈷️', name: 'Japanese "Monthly Amount" Button', category: 'symbols', keywords: ['japanese', 'monthly', 'amount'] },
  { emoji: '✴️', name: 'Eight-Pointed Star', category: 'symbols', keywords: ['star', 'eight', 'points'] },
  { emoji: '🆚', name: 'VS Button', category: 'symbols', keywords: ['vs', 'versus', 'against'] },
  { emoji: '💮', name: 'White Flower', category: 'symbols', keywords: ['flower', 'white', 'japanese'] },
  { emoji: '🉐', name: 'Japanese "Bargain" Button', category: 'symbols', keywords: ['bargain', 'japanese', 'deal'] },
  { emoji: '㊙️', name: 'Japanese "Secret" Button', category: 'symbols', keywords: ['secret', 'japanese', 'hidden'] },
  { emoji: '㊗️', name: 'Japanese "Congratulations" Button', category: 'symbols', keywords: ['congratulations', 'japanese', 'celebrate'] },
  { emoji: '🈴', name: 'Japanese "Passing Grade" Button', category: 'symbols', keywords: ['passing', 'grade', 'japanese'] },
  { emoji: '🈵', name: 'Japanese "No Vacancy" Button', category: 'symbols', keywords: ['no', 'vacancy', 'japanese'] },
  { emoji: '🈹', name: 'Japanese "Discount" Button', category: 'symbols', keywords: ['discount', 'japanese', 'sale'] },
  { emoji: '🈲', name: 'Japanese "Prohibited" Button', category: 'symbols', keywords: ['prohibited', 'japanese', 'no'] },
  { emoji: '🅰️', name: 'A Button (Blood Type)', category: 'symbols', keywords: ['a', 'blood', 'type'] },
  { emoji: '🅱️', name: 'B Button (Blood Type)', category: 'symbols', keywords: ['b', 'blood', 'type'] },
  { emoji: '🆎', name: 'AB Button (Blood Type)', category: 'symbols', keywords: ['ab', 'blood', 'type'] },
  { emoji: '🅾️', name: 'O Button (Blood Type)', category: 'symbols', keywords: ['o', 'blood', 'type'] },
  { emoji: '💯', name: 'Hundred Points', category: 'symbols', keywords: ['hundred', '100', 'score', 'perfect'] },
  { emoji: '🔥', name: 'Fire', category: 'symbols', keywords: ['fire', 'hot', 'lit', 'flame'] },
  { emoji: '⭐', name: 'Star', category: 'symbols', keywords: ['star', 'favorite', 'rating'] },
  { emoji: '🌟', name: 'Glowing Star', category: 'symbols', keywords: ['star', 'glow', 'shine'] },
  { emoji: '✨', name: 'Sparkles', category: 'symbols', keywords: ['sparkles', 'magic', 'shine'] },
  { emoji: '🎉', name: 'Party Popper', category: 'symbols', keywords: ['party', 'celebrate', 'confetti'] },
  { emoji: '🎊', name: 'Confetti Ball', category: 'symbols', keywords: ['confetti', 'party', 'celebrate'] },

  // Flags (20+ emojis)
  { emoji: '🏳️', name: 'White Flag', category: 'flags', keywords: ['white', 'flag', 'surrender'] },
  { emoji: '🏴', name: 'Black Flag', category: 'flags', keywords: ['black', 'flag', 'pirate'] },
  { emoji: '🏁', name: 'Chequered Flag', category: 'flags', keywords: ['checkered', 'flag', 'racing'] },
  { emoji: '🚩', name: 'Triangular Flag', category: 'flags', keywords: ['triangular', 'flag', 'red'] },
  { emoji: '🏳️‍🌈', name: 'Rainbow Flag', category: 'flags', keywords: ['rainbow', 'pride', 'lgbtq'] },
  { emoji: '🏳️‍⚧️', name: 'Transgender Flag', category: 'flags', keywords: ['transgender', 'flag', 'trans'] },
  { emoji: '🏴‍☠️', name: 'Pirate Flag', category: 'flags', keywords: ['pirate', 'flag', 'skull'] },
  { emoji: '🇺🇸', name: 'United States Flag', category: 'flags', keywords: ['usa', 'america', 'flag'] },
  { emoji: '🇬🇧', name: 'United Kingdom Flag', category: 'flags', keywords: ['uk', 'britain', 'flag'] },
  { emoji: '🇨🇦', name: 'Canada Flag', category: 'flags', keywords: ['canada', 'maple', 'flag'] },
  { emoji: '🇫🇷', name: 'France Flag', category: 'flags', keywords: ['france', 'french', 'flag'] },
  { emoji: '🇩🇪', name: 'Germany Flag', category: 'flags', keywords: ['germany', 'german', 'flag'] },
  { emoji: '🇯🇵', name: 'Japan Flag', category: 'flags', keywords: ['japan', 'japanese', 'flag'] },
  { emoji: '🇰🇷', name: 'South Korea Flag', category: 'flags', keywords: ['korea', 'south', 'flag'] },
  { emoji: '🇨🇳', name: 'China Flag', category: 'flags', keywords: ['china', 'chinese', 'flag'] },
  { emoji: '🇮🇳', name: 'India Flag', category: 'flags', keywords: ['india', 'indian', 'flag'] },
  { emoji: '🇦🇺', name: 'Australia Flag', category: 'flags', keywords: ['australia', 'aussie', 'flag'] },
  { emoji: '🇧🇷', name: 'Brazil Flag', category: 'flags', keywords: ['brazil', 'brazilian', 'flag'] },
  { emoji: '🇷🇺', name: 'Russia Flag', category: 'flags', keywords: ['russia', 'russian', 'flag'] },
  { emoji: '🇪🇸', name: 'Spain Flag', category: 'flags', keywords: ['spain', 'spanish', 'flag'] },
  { emoji: '🇮🇹', name: 'Italy Flag', category: 'flags', keywords: ['italy', 'italian', 'flag'] },
  { emoji: '🇳🇱', name: 'Netherlands Flag', category: 'flags', keywords: ['netherlands', 'dutch', 'flag'] },
  { emoji: '🇸🇪', name: 'Sweden Flag', category: 'flags', keywords: ['sweden', 'swedish', 'flag'] },
  { emoji: '🇳🇴', name: 'Norway Flag', category: 'flags', keywords: ['norway', 'norwegian', 'flag'] },
  { emoji: '🇩🇰', name: 'Denmark Flag', category: 'flags', keywords: ['denmark', 'danish', 'flag'] },
  { emoji: '🇫🇮', name: 'Finland Flag', category: 'flags', keywords: ['finland', 'finnish', 'flag'] },
  { emoji: '🇨🇭', name: 'Switzerland Flag', category: 'flags', keywords: ['switzerland', 'swiss', 'flag'] },
  { emoji: '🇦🇹', name: 'Austria Flag', category: 'flags', keywords: ['austria', 'austrian', 'flag'] },
  { emoji: '🇧🇪', name: 'Belgium Flag', category: 'flags', keywords: ['belgium', 'belgian', 'flag'] },
  { emoji: '🇵🇹', name: 'Portugal Flag', category: 'flags', keywords: ['portugal', 'portuguese', 'flag'] },
  { emoji: '🇬🇷', name: 'Greece Flag', category: 'flags', keywords: ['greece', 'greek', 'flag'] },
  { emoji: '🇹🇷', name: 'Turkey Flag', category: 'flags', keywords: ['turkey', 'turkish', 'flag'] },
  { emoji: '🇮🇱', name: 'Israel Flag', category: 'flags', keywords: ['israel', 'israeli', 'flag'] },
  { emoji: '🇸🇦', name: 'Saudi Arabia Flag', category: 'flags', keywords: ['saudi', 'arabia', 'flag'] },
  { emoji: '🇦🇪', name: 'United Arab Emirates Flag', category: 'flags', keywords: ['uae', 'emirates', 'flag'] },
  { emoji: '🇪🇬', name: 'Egypt Flag', category: 'flags', keywords: ['egypt', 'egyptian', 'flag'] },
  { emoji: '🇿🇦', name: 'South Africa Flag', category: 'flags', keywords: ['south', 'africa', 'flag'] },
  { emoji: '🇳🇬', name: 'Nigeria Flag', category: 'flags', keywords: ['nigeria', 'nigerian', 'flag'] },
  { emoji: '🇰🇪', name: 'Kenya Flag', category: 'flags', keywords: ['kenya', 'kenyan', 'flag'] },
  { emoji: '🇲🇽', name: 'Mexico Flag', category: 'flags', keywords: ['mexico', 'mexican', 'flag'] },
  { emoji: '🇦🇷', name: 'Argentina Flag', category: 'flags', keywords: ['argentina', 'argentinian', 'flag'] },
  { emoji: '🇨🇱', name: 'Chile Flag', category: 'flags', keywords: ['chile', 'chilean', 'flag'] },
  { emoji: '🇨🇴', name: 'Colombia Flag', category: 'flags', keywords: ['colombia', 'colombian', 'flag'] },
  { emoji: '🇵🇪', name: 'Peru Flag', category: 'flags', keywords: ['peru', 'peruvian', 'flag'] },
  { emoji: '🇻🇪', name: 'Venezuela Flag', category: 'flags', keywords: ['venezuela', 'venezuelan', 'flag'] },
  { emoji: '🇺🇾', name: 'Uruguay Flag', category: 'flags', keywords: ['uruguay', 'uruguayan', 'flag'] },
  { emoji: '🇵🇾', name: 'Paraguay Flag', category: 'flags', keywords: ['paraguay', 'paraguayan', 'flag'] },
  { emoji: '🇧🇴', name: 'Bolivia Flag', category: 'flags', keywords: ['bolivia', 'bolivian', 'flag'] },
  { emoji: '🇪🇨', name: 'Ecuador Flag', category: 'flags', keywords: ['ecuador', 'ecuadorian', 'flag'] },
  { emoji: '🇬🇾', name: 'Guyana Flag', category: 'flags', keywords: ['guyana', 'guyanese', 'flag'] },
  { emoji: '🇸🇷', name: 'Suriname Flag', category: 'flags', keywords: ['suriname', 'surinamese', 'flag'] },
  { emoji: '🇫🇫', name: 'French Guiana Flag', category: 'flags', keywords: ['french', 'guiana', 'flag'] }
];

export function EmojiSearch({ onViewChange }: EmojiSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState('smileys')
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])
  const [favoriteEmojis, setFavoriteEmojis] = useState<string[]>([])
  const [copiedEmoji, setCopiedEmoji] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { addClip } = useClipboardStore()

  // Filter emojis based on search query
  const filteredEmojis = searchQuery
    ? EMOJI_DATA.filter(emoji => 
        emoji.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emoji.keywords.some(keyword => keyword.includes(searchQuery.toLowerCase()))
      )
    : EMOJI_DATA.filter(emoji => emoji.category === activeCategory)

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Load recent and favorite emojis from localStorage
  useEffect(() => {
    try {
      const storedRecent = localStorage.getItem('recentEmojis')
      const storedFavorites = localStorage.getItem('favoriteEmojis')
      
      if (storedRecent) setRecentEmojis(JSON.parse(storedRecent))
      if (storedFavorites) setFavoriteEmojis(JSON.parse(storedFavorites))
    } catch (error) {
      console.error("Failed to load emojis from localStorage:", error)
    }
  }, [])

  // Save recent and favorite emojis to localStorage
  const saveToLocalStorage = (key: 'recentEmojis' | 'favoriteEmojis', data: string[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error)
    }
  }

  // Handle emoji click - copy to clipboard and add to recent
  const handleEmojiClick = (emoji: string) => {
    // Copy to clipboard
    navigator.clipboard.writeText(emoji)
    
    // Add to clipboard manager
    addClip({
      type: "text",
      title: `Emoji: ${emoji}`,
      content: emoji,
      folderId: null,
      tags: ["emoji"],
      source: "Emoji Search"
    })
    
    // Show feedback
    setCopiedEmoji(emoji)
    setTimeout(() => setCopiedEmoji(null), 1500)
    
    // Add to recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 24)
    setRecentEmojis(newRecent)
    saveToLocalStorage('recentEmojis', newRecent)
  }

  // Toggle favorite status
  const toggleFavorite = (emoji: string) => {
    let newFavorites: string[]
    
    if (favoriteEmojis.includes(emoji)) {
      newFavorites = favoriteEmojis.filter(e => e !== emoji)
    } else {
      newFavorites = [emoji, ...favoriteEmojis].slice(0, 24)
    }
    
    setFavoriteEmojis(newFavorites)
    saveToLocalStorage('favoriteEmojis', newFavorites)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to go back to command view
      if (e.key === "Escape") {
        onViewChange("command")
      }

      // Command+F to focus search
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onViewChange])

  // Render emoji grid
  const renderEmojiGrid = (emojis: Emoji[] | string[]) => {
    const renderEmoji = (emoji: string | Emoji, index: number) => {
      const emojiChar = typeof emoji === 'string' ? emoji : emoji.emoji
      const emojiName = typeof emoji === 'string' 
        ? EMOJI_DATA.find(e => e.emoji === emoji)?.name || 'Emoji'
        : emoji.name
      
      const isFavorite = favoriteEmojis.includes(emojiChar)
      
      return (
        <div 
          key={`${emojiChar}-${index}`}
          className={cn(
            "flex flex-col items-center p-2 rounded-md cursor-pointer hover:bg-accent/50 relative group",
            copiedEmoji === emojiChar && "bg-primary/20"
          )}
          onClick={() => handleEmojiClick(emojiChar)}
          title={emojiName}
        >
          <span className="text-2xl mb-1">{emojiChar}</span>
          {copiedEmoji === emojiChar && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              Copied!
            </div>
          )}
          <button
            className={cn(
              "absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity",
              isFavorite && "opacity-100 text-yellow-400"
            )}
            onClick={(e) => {
              e.stopPropagation()
              toggleFavorite(emojiChar)
            }}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
          </button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-8 gap-1 p-2">
        {emojis.length > 0 ? (
          (Array.isArray(emojis) && typeof emojis[0] === 'string')
            ? (emojis as string[]).map((emoji, index) => renderEmoji(emoji, index))
            : (emojis as Emoji[]).map((emoji, index) => renderEmoji(emoji, index))
        ) : (
          <div className="col-span-8 py-8 text-center text-muted-foreground">
            No emojis found
          </div>
        )}
      </div>
    )
  }

  // Render emoji categories
  const renderCategories = () => {
    return (
      <div className="flex overflow-x-auto p-2 border-b gap-1">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            className={cn(
              "flex items-center justify-center min-w-10 h-10 rounded-md p-2 shrink-0",
              activeCategory === category.id 
                ? "bg-primary/20 text-primary" 
                : "hover:bg-accent/50"
            )}
            onClick={() => {
              setActiveCategory(category.id)
              setSearchQuery("")
            }}
            title={category.name}
          >
            {category.icon || <span className="text-lg">{category.emoji}</span>}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Top Bar */}
      <div className="flex items-center border-b p-4">
        <div className="tooltip">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange("command")}
            className="mr-2 btn-hover-effect"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="tooltip-text">Back (Esc)</span>
        </div>
        
        <h3 className="font-medium flex items-center">Emoji Search</h3>
        
        <div className="flex-1 relative mx-4">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searchQuery && (
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Input
            ref={searchInputRef}
            placeholder="Search emojis..."
            className="pl-8 pr-8 focus-visible:ring-0 border-none shadow-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Emoji Categories */}
      {!searchQuery && renderCategories()}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          <div className="p-4">
            <h4 className="text-sm text-muted-foreground mb-2">
              {filteredEmojis.length} result{filteredEmojis.length !== 1 ? 's' : ''} for "{searchQuery}"
            </h4>
            {renderEmojiGrid(filteredEmojis)}
          </div>
        ) : (
          <Tabs defaultValue={activeCategory === 'recent' ? 'recent' : activeCategory === 'favorites' ? 'favorites' : 'category'}>
            <TabsContent value="recent" className="m-0">
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">Recently Used</h4>
                {recentEmojis.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No recent emojis
                  </div>
                ) : (
                  renderEmojiGrid(recentEmojis)
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="favorites" className="m-0">
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">Favorites</h4>
                {favoriteEmojis.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No favorite emojis yet. Click the star icon to add emojis to favorites.
                  </div>
                ) : (
                  renderEmojiGrid(favoriteEmojis)
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="category" className="m-0">
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">
                  {CATEGORIES.find(cat => cat.id === activeCategory)?.name || 'Emojis'}
                </h4>
                {renderEmojiGrid(filteredEmojis)}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t bg-accent/10 text-xs text-muted-foreground flex justify-between">
        <div>Click emoji to copy • ⌘F to search</div>
        <div>Press ⭐ to favorite</div>
      </div>
    </div>
  )
} 