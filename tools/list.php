<?php
$rawJson = file_get_contents("php://stdin");
$json = json_decode($rawJson, true);

$students = [];
foreach ($json['songs'] as $song) {
  foreach ($song["performers"] as $instrument) {
    foreach ($instrument['names'] as $s) {
      if (!isset($students[$s])) $students[$s] = [];
      $students[$s][] = $song;
    }
  }
}

foreach ($students as $s => $songs) {
  echo '==='.$s.'==='.PHP_EOL;
  foreach ($songs as $song) {
    echo '  - '.$song['begins'].' '.$song['title'].' '.PHP_EOL;
  }
  echo PHP_EOL;
}
