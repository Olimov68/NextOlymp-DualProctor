<?php
$w = 512; 
$h = 512;
$img = imagecreatetruecolor($w, $h);

$bg = imagecolorallocate($img, 10, 13, 24);
imagefill($img, 0, 0, $bg);

$sideColor = imagecolorallocatealpha($img, 99, 102, 241, 60);
imagefilledpolygon($img, [155, 345, 205, 235, 250, 345], $sideColor);
imagefilledpolygon($img, [262, 345, 307, 235, 357, 345], $sideColor);

$mainColor = imagecolorallocate($img, 129, 140, 248);
imagefilledpolygon($img, [195, 345, 256, 140, 317, 345], $mainColor);

$white = imagecolorallocate($img, 255, 255, 255);
imagesetthickness($img, 3);
imageline($img, 256, 140, 256, 345, $white);
imageline($img, 140, 345, 372, 345, $mainColor);
imagefilledellipse($img, 256, 140, 10, 10, $white);

imagepng($img, __DIR__ . '/../public/logo.png');
imagedestroy($img);
echo "Logo muvaffaqiyatli yaratildi!\n";
