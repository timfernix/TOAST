# 🏆 **Explanation of Bracket Creation Process**

## 📌 **Overview**
This section focuses on the core functionality of retrieving players from the database, balancing them across servers, pairing them fairly, and sending an embed message with the match details.

---

## 📥 **Fetching Players from Database**
```js
const query = 'SELECT id, CAST(discord_id AS CHAR) AS discord_id, nickname, server, otp FROM toast WHERE wins >= ? AND eliminated = FALSE';
const [rows] = await connection.execute(query, [wins]);
```
🔹 This query retrieves all players who:
- Have a minimum number of `wins`.
- Are **not** eliminated (`eliminated = FALSE`).
- Their `discord_id`, `nickname`, `server`, and `otp` (One-Trick Champion) are selected.
- The `CAST(discord_id AS CHAR)` ensures the ID is treated as a string.

---

## 🏠 **Organizing Players by Server**

### **1️⃣ Initializing Data Structures**
```js
const serverCounts = {};
const multiServerPlayers = [];
const playerData = [];
```
🔹 These structures store:
- `serverCounts`: A count of how many players belong to each server.
- `multiServerPlayers`: Players who are part of **multiple** servers.
- `playerData`: Players assigned to a **single** server.

### **2️⃣ Processing Players**
```js
rows.forEach(player => {
    const servers = player.server.split(',').map(s => s.trim());
    if (servers.length > 1) {
        multiServerPlayers.push({
            discord_id: player.discord_id,
            nickname: player.nickname,
            servers: servers,
            otp: player.otp
        });
    } else {
        const server = servers[0];
        if (!serverCounts[server]) serverCounts[server] = 0;
        serverCounts[server]++;
        playerData.push({ ...player, server });
    }
});
```
🔹 **Steps:**
1. Splits the `server` string into an array (some players belong to multiple servers).
2. If a player has **more than one server**, they are added to `multiServerPlayers`.
3. If they belong to **one** server, they are added to `playerData`, and their server count is updated.

### **3️⃣ Assigning Multi-Server Players**
```js
multiServerPlayers.forEach(player => {
    let bestServer = player.servers[0];
    let bestBalance = Infinity;

    player.servers.forEach(server => {
        const newBalance = Math.abs((serverCounts[server] + 1) % 2);
        if (newBalance < bestBalance) {
            bestBalance = newBalance;
            bestServer = server;
        }
    });

    if (!serverCounts[bestServer]) serverCounts[bestServer] = 0;
    serverCounts[bestServer]++;
    playerData.push({ ...player, server: bestServer });
});
```
🔹 **Logic:**
- Each multi-server player is assigned to the **best-balanced** server.
- The best server is determined by which one keeps the team numbers **most even**.

---

## 🎲 **Pairing Players Randomly**

### **1️⃣ Shuffling Players**
```js
playerData.sort(() => Math.random() - 0.5);
```
🔹 **Randomizes** player order to ensure fair matchups.

### **2️⃣ Pairing Players**
```js
const pairs = [];
const usedPlayers = new Set();
```
🔹 `pairs`: Stores matched players.
🔹 `usedPlayers`: Ensures each player is **only matched once**.

```js
for (let i = 0; i < playerData.length; i++) {
    const player1 = playerData[i];
    if (usedPlayers.has(player1.discord_id)) continue;
    for (let j = i + 1; j < playerData.length; j++) {
        const player2 = playerData[j];
        if (usedPlayers.has(player2.discord_id) || player1.otp === player2.otp || player1.server !== player2.server) continue;
        pairs.push([player1, player2]);
        usedPlayers.add(player1.discord_id);
        usedPlayers.add(player2.discord_id);
        break;
    }
}

const remainingPlayers = playerData.filter(p => !usedPlayers.has(p.discord_id));
    if (remainingPlayers.length === 2) {
        const [player1, player2] = remainingPlayers;
        pairs.push([player1, player2]);
        usedPlayers.add(player1.discord_id);
        usedPlayers.add(player2.discord_id);
        }
```
🔹 **Pairing Criteria:**
1. **Players are matched if:**
   - They **haven't been used** yet.
   - They **don't have the same OTP champion** (to avoid mirror matches).
   - They **belong to the same server**.
2. The first available player that fits these criteria is chosen.
(If there are only two players left and they have the same otp, they are matched anyways.)
---

## ❌ **Handling Unpaired Players**
```js
const unpairedPlayers = playerData.filter(player => !usedPlayers.has(player.discord_id));
```
🔹 Filters out any players who were **not matched** into a pair.

---

## 📢 **Creating and Sending the Embed**

### **1️⃣ Initializing the Embed**
```js
const embed = new EmbedBuilder()
    .setTitle(`Tournament Bracket`)
    .setColor(0xff5601)
    .setFooter({ text: 'Good luck to all participants!' });
```
🔹 The **main embed** is created with:
- A **title**.
- A **color** (`0xff5601`(orange) to match the image).
- A **footer** wishing participants good luck.

### **2️⃣ Adding Matches to Embed**
```js
let fieldContent = '';
pairs.forEach((pair, index) => {
    fieldContent += `<@${pair[0].discord_id}> vs <@${pair[1].discord_id}>\n`;
    if ((index + 1) % 4 === 0 || index === pairs.length - 1) {
        embed.addFields({ name: `Matches ${Math.floor(index / 4) * 4 + 1}-${Math.min((Math.floor(index / 4) + 1) * 4, pairs.length)}`, value: fieldContent });
        fieldContent = '';
    }
});
```
🔹 **Steps:**
1. Iterates through all match pairs.
2. Formats them as **`Player1 vs Player2`**.
3. Every **4 matches**, they are grouped into an embed field to save space.

### **3️⃣ Handling Unpaired Players**
```js
if (unpairedPlayers.length > 0) {
    const unpairedEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription('Not paired players:');
    unpairedPlayers.forEach(player => {
        unpairedEmbed.addFields({ name: `${player.nickname} (${player.server})`, value: `<@${player.discord_id}> (${player.otp})` });
    });
    await interaction.channel.send({ embeds: [embed, unpairedEmbed] });
} else {
    await interaction.channel.send({ embeds: [embed] });
}
```
🔹 **If any players were left unpaired**, an additional embed is sent listing them.

---

## ✅ **Summary**
1️⃣ **Retrieve** eligible players from the database.
2️⃣ **Assign** multi-server players to balanced teams.
3️⃣ **Shuffle** the player list for randomization.
4️⃣ **Pair** players while avoiding conflicts.
5️⃣ **Handle** unpaired players separately.
6️⃣ **Send** an embed with match pairings.

🎉 **The tournament bracket is now ready!**
