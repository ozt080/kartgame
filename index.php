<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Turbo Karts</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-dark text-light">
  <nav class="navbar navbar-dark bg-black">
    <div class="container"><span class="navbar-brand fw-bold">🏎️ Turbo Karts</span></div>
  </nav>

  <main class="container py-4">
    <div class="row g-4">
      <div class="col-lg-8">
        <canvas id="game" width="800" height="600" class="w-100 rounded border border-secondary"></canvas>
        <div class="d-flex justify-content-between mt-2 fs-5">
          <span>Tour : <b id="lap">1</b>/3</span>
          <span>Temps : <b id="time">0.00</b> s</span>
          <span>Position : <b id="pos">-</b></span>
        </div>
        <div class="input-group mt-3">
          <input id="pseudo" class="form-control" placeholder="Ton pseudo" maxlength="20">
          <button id="start" class="btn btn-warning">Jouer</button>
        </div>
        <p class="text-secondary small mt-2">Flèches ou WASD pour conduire. Reste sur la piste grise !</p>
      </div>

      <div class="col-lg-4">
        <h2 class="h4">🏆 Classement</h2>
        <table class="table table-dark table-striped">
          <thead><tr><th>#</th><th>Pseudo</th><th>Temps</th></tr></thead>
          <tbody id="board"></tbody>
        </table>
      </div>
    </div>
  </main>

  <script src="js/game.js"></script>
</body>
</html>