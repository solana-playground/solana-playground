
describe("Tictactoe game", async () => {
  const player1 = pg.wallet.publicKey;
  const player2 = pg.wallet.publicKey;

  function printgame(grid) {
    console.log(`${grid[0]} ${grid[1]} ${grid[2]}`);
    console.log(`${grid[3]} ${grid[4]} ${grid[5]}`);
    console.log(`${grid[6]} ${grid[7]} ${grid[8]}`);
  }

  let [game] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("ttt"), pg.wallet.publicKey.toBytes()],
    pg.program.programId
  );

  it("Create Game!", async () => {
    let tx = await pg.program.methods
      .initGame(player1, player2)
      .accounts({
        owner: pg.wallet.publicKey,
        game: game
      })
      .rpc();

    console.log("Create game tx signature", tx);
    console.log("Game address", game.toString());
  });

  it("Turn 1", async () => {
    let person = 1;
    let position = 5;

    let tx = await pg.program.methods
      .playGame(person, position)
      .accounts({
        player: player1,
        gameData: game,
      })
      .rpc();

    await pg.connection.confirmTransaction(tx);
    console.log("Turn 1 signature", tx);

    const gameAccount = await pg.program.account.game.fetch(game);
    printgame(gameAccount.grid);
  });

  it("Turn 2", async () => {
    let person = 2;
    let position = 9;

    let tx = await pg.program.methods
      .playGame(person, position)
      .accounts({
        player: player2,
        gameData: game,
      })
      .rpc();

    await pg.connection.confirmTransaction(tx);
    console.log("Turn 2 signature", tx);

    const gameAccount = await pg.program.account.game.fetch(game);
    printgame(gameAccount.grid);
  });
});
