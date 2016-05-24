<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");


$outp = "";

    $outp .= '{"LicensePlate":"ภล-2334",';
    $outp .= '"Speed":"76",';
    $outp .= '"Address":"45/33 ซ.สวนหลวง 23 กทม. 10430",';
    $outp .= '"Status":"เคลื่อนที่"}'; 

$outp ='['.$outp.']';

echo($outp);
?>