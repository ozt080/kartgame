<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Aide - Turbo Karts</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-dark text-light">
  <nav class="navbar navbar-dark bg-black">
    <div class="container">
      <a class="navbar-brand fw-bold" href="index.php">🏎️ Turbo Karts</a>
      <div>
        <a class="btn btn-sm btn-outline-light" href="aide.php?p=regles">Règles</a>
        <a class="btn btn-sm btn-outline-light" href="aide.php?p=changelog">Changelog</a>
        <a class="btn btn-sm btn-outline-light" href="aide.php?p=contributing">Contribuer</a>
      </div>
    </div>
  </nav>
  <main class="container py-4"><div id="content"></div></main>

  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>
  <script>
    const allowed = ['regles', 'changelog', 'contributing'];
    let p = new URLSearchParams(location.search).get('p') || 'regles';
    if (!allowed.includes(p)) p = 'regles';
    fetch('docs/' + p + '.md')
      .then(r => r.text())
      .then(md => document.getElementById('content').innerHTML = DOMPurify.sanitize(marked.parse(md)));
  </script>
</body>
</html>