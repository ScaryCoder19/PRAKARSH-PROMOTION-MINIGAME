# PRAKARSH '26 - Game Challenge 🎮

Yo! Welcome to the game challenge for Prakarsh '26. This is a simple quiz app we built where players guess the image shown on screen (Memes, Logos, or Dialogues).

It's super lightweight and runs right in the browser.

## How to Play
1. Click **Start Game**.
2. An image pops up based on the random category.
3. If the player guesses right, click the **Check/Correct** button.
4. If they mess up, click the **Cross/Wrong** button.
5. Watch the score go up (or not).

*Mistake?* No worries, the **Undo** button actually works now lol.

## Running the Game
You don't need any complex server stuff.
1. Just download the files.
2. Double-click `index.html`.
3. That's it.

## Adding New Images
If you want to add your own memes or questions, here is the drill:
1. Go into `assets/` and pick the folder (like `memes`).
2. Name your image files simply: `1.png`, `2.jpg`, `3.webp`, etc. Order doesn't matter much but keep the numbers sequential if you can.
3. **Crucial Step**: Open `script.js` and update the count! 
   
   Look for the `CONFIG` at the top:
   ```javascript
   memes: { path: 'assets/memes/', count: 31, label: 'Meme' }
   ```
   Change `31` to however many files you have. If you don't do this, the game won't find your new stuff.

## Credits
Built for Prakarsh '26. Have fun with it! 🚀
