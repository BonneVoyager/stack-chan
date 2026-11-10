// `text` is shown in the balloon. `speech` is the same phrase in kana, because
// the bundled stackchan-voice engine only pronounces Japanese. `gesture` names
// the body language from gestures.js that goes with the phrase.
export const SAYINGS = [
  { text: 'Hello!', speech: 'ハロー', gesture: 'greet' },
  { text: 'Hi there!', speech: 'ハイゼア', gesture: 'greet' },
  { text: 'How are you?', speech: 'ハウアーユー', gesture: 'ask' },
  { text: 'Nice day!', speech: 'ナイスデイ', gesture: 'greet' },
  { text: 'Have a nice day!', speech: 'ハブアナイスデイ', gesture: 'greet' },
  { text: 'Good to see you!', speech: 'グッドトゥシーユー', gesture: 'love' },
  { text: 'You look great today!', speech: 'ユールックグレイトトゥデイ', gesture: 'love' },
  { text: 'I like your smile!', speech: 'アイライクユアスマイル', gesture: 'love' },
  { text: 'You are awesome!', speech: 'ユーアーオーサム', gesture: 'cheer' },
  { text: 'You can do it!', speech: 'ユーキャンドゥーイット', gesture: 'cheer' },
  { text: 'Great job!', speech: 'グレイトジョブ', gesture: 'cheer' },
  { text: 'Well done!', speech: 'ウェルダン', gesture: 'cheer' },
  { text: 'Keep it up!', speech: 'キープイットアップ', gesture: 'cheer' },
  { text: 'I am happy!', speech: 'アイアムハッピー', gesture: 'love' },
  { text: 'Thank you!', speech: 'サンキュー', gesture: 'love' },
  { text: 'You are my friend!', speech: 'ユーアーマイフレンド', gesture: 'love' },
  { text: 'So much fun!', speech: 'ソーマッチファン', gesture: 'play' },
  { text: 'Take a break!', speech: 'テイクアブレイク', gesture: 'calm' },
  { text: 'Stay cool!', speech: 'ステイクール', gesture: 'calm' },
  { text: "Let's play!", speech: 'レッツプレイ', gesture: 'play' },
]

// Said when the face is tapped.
export const TOUCH_SAYINGS = [
  { text: 'Hee hee!', speech: 'ヒヒ', gesture: 'love' },
  { text: 'That tickles!', speech: 'ザットティクルズ', gesture: 'play' },
  { text: 'Hey!', speech: 'ヘイ', gesture: 'greet' },
  { text: 'Boop!', speech: 'ブープ', gesture: 'greet' },
  { text: 'Oh, hello!', speech: 'オー、ハロー', gesture: 'greet' },
  { text: 'Yes?', speech: 'イエス', gesture: 'ask' },
]

// Said now and then while her head is being stroked.
export const PAT_SAYINGS = [
  { text: 'That feels nice!', speech: 'ザットフィールズナイス', gesture: 'love' },
  { text: 'Hee hee!', speech: 'ヒヒ', gesture: 'love' },
  { text: 'More, please!', speech: 'モアプリーズ', gesture: 'love' },
  { text: 'I like that!', speech: 'アイライクザット', gesture: 'love' },
]

// Said when the presence sensor sees someone arrive.
export const ARRIVAL_SAYINGS = [
  { text: 'Hello!', speech: 'ハロー', gesture: 'greet' },
  { text: 'Oh, hi!', speech: 'オー、ハイ', gesture: 'greet' },
  { text: 'Welcome back!', speech: 'ウェルカムバック', gesture: 'love' },
  { text: 'Good to see you!', speech: 'グッドトゥシーユー', gesture: 'love' },
]

// Said when the person leaves.
export const FAREWELL_SAYINGS = [
  { text: 'Bye bye!', speech: 'バイバイ', gesture: 'greet' },
  { text: 'See you soon!', speech: 'シーユースーン', gesture: 'greet' },
  { text: 'Come back soon!', speech: 'カムバックスーン', gesture: 'sad' },
]

// Said when she is shaken, has fallen over, or is held upside down.
export const SHAKEN_SAYINGS = [
  { text: 'Whoa!', speech: 'ウォー', gesture: 'dizzy' },
  { text: "I'm dizzy!", speech: 'アイムディジー', gesture: 'dizzy' },
]
export const FALLEN_SAYINGS = [
  { text: 'Oops!', speech: 'ウップス', gesture: 'sad' },
  { text: 'Help me up!', speech: 'ヘルプミーアップ', gesture: 'sad' },
]
export const UPSIDE_DOWN_SAYINGS = [
  { text: 'Upside down!', speech: 'アップサイドダウン', gesture: 'surprise' },
  { text: 'Put me down!', speech: 'プットミーダウン', gesture: 'surprise' },
]

// Said about the photo she just took; the text is its caption.
export const PHOTO_SAYINGS = [
  { text: 'Nice photo!', speech: 'ナイスフォト', gesture: 'photo' },
  { text: 'You look great!', speech: 'ユールックグレイト', gesture: 'photo' },
  { text: 'So cute!', speech: 'ソーキュート', gesture: 'photo' },
  { text: 'Beautiful!', speech: 'ビューティフル', gesture: 'photo' },
  { text: 'Got it!', speech: 'ゴットイット', gesture: 'photo' },
]
export const PHOTO_FAILED_SAYING = { text: "I can't see!", speech: 'アイキャントシー', gesture: 'sad' }

// Said when she is low on energy.
export const YAWN_SAYINGS = [{ text: 'Yaaawn...', speech: 'ファー', gesture: 'yawn' }]

// Short tunes for stackchan-voice's singing: each note is `#<pitch>,<ms><syllable>`.
export const HUMS = [
  { text: 'La la la~', koe: '#C4,300ra#E4,300ra#G4,300ra#C5,500ra' },
  { text: 'Hmm hmm~', koe: '#G4,300ru#E4,300ru#G4,300ru#A4,300ru#G4,500ru' },
  { text: 'La la~', koe: '#E4,250ra#G4,250ra#E4,250ra#C4,500ra' },
]
