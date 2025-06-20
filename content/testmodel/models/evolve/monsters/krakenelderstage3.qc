// Created by Crowbar 0.67

$modelname "evolve\monsters\krakenelderstage3.mdl"

$bodygroup "ElderKraken"
{
	studio "krakenelder3.smd"
}
$bodygroup "Headpiece"
{
	studio "krakenelder3_headpiece.smd"
	blank
}
$bodygroup "clamped1"
{
	studio "body2_model0.smd"
}


$surfaceprop "default"

$contents "solid"

$illumposition 0.001 -66.637 213.516

$ambientboost

$mostlyopaque

$cdmaterials "models\evolve\monsters\krakenelder\"
$cdmaterials ""

$texturegroup "skinfamilies"
{
	{ "krakenelder3_upper"        "krakenelder3_lower"        }
	{ "krakenelder3_upper_damage" "krakenelder3_lower_damage" }
}

$cbox 0 0 0 0 0 0

$bbox -251.416 -321.313 -29.548 384.689 321.315 456.58

$definebone "Bip_01" "" 0 0 0 0 0 0 0 0 0 0 0 0
$definebone "bone_root" "Bip_01" 0 -48.962463 185.968018 0 0 0 0 0 0 0 0 0
$definebone "bone_pelvis" "bone_root" 0 -13.976467 -13.092941 0 0 0 0 0 0 0 0 0
$definebone "bone_L_hip" "bone_pelvis" -9.7694 15.173977 -5.500977 0 0 0 0 0 0 0 0 0
$definebone "bone_L_thigh" "bone_L_hip" -11.623693 -0.357269 0.090698 0 0 0 0 0 0 0 0 0
$definebone "bone_L_leg" "bone_L_thigh" -41.538017 38.301762 -68.707596 0 0 0 0 0 0 0 0 0
$definebone "bone_L_loleg" "bone_L_leg" 6.438065 -58.801487 -43.429928 0 0 0 0 0 0 0 0 0
$definebone "bone_L_foot" "bone_L_loleg" -4.383205 21.885719 -39.810772 0 0 0 0 0 0 0 0 0
$definebone "bone_L_foot_palm" "bone_L_foot" -0.276691 2.45533 -9.955803 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_indexA" "bone_L_foot_palm" 7.18924 14.568203 0.411935 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_indexB" "bone_L_toe_indexA" 5.033676 11.830467 -0.63274 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_middleA" "bone_L_foot_palm" -2.219975 15.90077 0.79304 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_middleB" "bone_L_toe_middleA" -0.198841 12.154169 2.25282 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_pinkyA" "bone_L_foot_palm" -8.373898 2.544247 -0.935994 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_pinkyB" "bone_L_toe_pinkyA" -6.617722 12.801151 0.000212 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_pinkyC" "bone_L_toe_pinkyB" -6.589417 12.746639 2.577246 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_thumbA" "bone_L_foot" 1.062572 -1.261044 -11.257005 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_thumbB" "bone_L_toe_thumbA" 3.007748 -10.532955 2.119264 0 0 0 0 0 0 0 0 0
$definebone "bone_R_hip" "bone_pelvis" 9.7694 15.173977 -5.500977 0 0 0 0 0 0 0 0 0
$definebone "bone_R_thigh" "bone_R_hip" 11.623693 -0.357197 0.090775 0 0 0 0 0 0 0 0 0
$definebone "bone_R_leg" "bone_R_thigh" 41.548775 38.294785 -68.699532 0 0 0 0 0 0 0 0 0
$definebone "bone_R_loleg" "bone_R_leg" -6.319969 -58.805996 -43.432819 0 0 0 0 0 0 0 0 0
$definebone "bone_R_foot" "bone_R_loleg" 4.246204 21.903931 -39.80862 0 0 0 0 0 0 0 0 0
$definebone "bone_R_foot_palm" "bone_R_foot" 0.276546 2.485237 -9.950051 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_indexA" "bone_R_foot_palm" -7.19062 14.5634 0.453525 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_indexB" "bone_R_toe_indexA" -5.034431 11.829418 -0.59914 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_middleA" "bone_R_foot_palm" 2.219997 15.894341 0.838677 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_middleB" "bone_R_toe_middleA" 0.198383 12.144886 2.286951 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_pinkyA" "bone_R_foot_palm" 8.373966 2.54665 -0.928591 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_pinkyB" "bone_R_toe_pinkyA" 6.618408 12.797817 0.03677 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_pinkyC" "bone_R_toe_pinkyB" 6.590363 12.736097 2.612997 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_thumbA" "bone_R_foot" -1.062576 -1.225773 -11.26206 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_thumbB" "bone_R_toe_thumbA" -2.945507 -10.553677 2.087147 0 0 0 0 0 0 0 0 0
$definebone "bone_spine01" "bone_root" 0 4.638359 8.663757 0 0 0 0 0 0 0 0 0
$definebone "bone_spine02" "bone_spine01" 0 9.970173 15.610886 0 0 0 0 0 0 0 0 0
$definebone "bone_chest" "bone_spine02" 0 29.374832 25.634933 0 0 0 0 0 0 0 0 0
$definebone "Bip01_Head" "bone_chest" 0 50.860153 20.797455 0 0 0 0 0 0 0 0 0
$definebone "bone_skull" "Bip01_Head" 0 22.461033 11.863922 0 0 0 0 0 0 0 0 0
$definebone "bone_jawA" "bone_skull" 0 -14.44276 -45.476822 0 0 0 0 0 0 0 0 0
$definebone "bone_jawB" "bone_jawA" 0 19.506069 -2.225632 0 0 -0.000015 0 0 0 0 0 0
$definebone "bone_jawC" "bone_jawB" 0 19.385956 -2.380234 0 0 0.000015 0 0 0 0 0 0
$definebone "bone_L_mouthA" "bone_jawC" -3.139192 16.756729 -2.419525 0 0 0 0 0 0 0 0 0
$definebone "bone_L_mouthB" "bone_L_mouthA" -1.048116 10.396683 5.379074 0 0 0 0 0 0 0 0 0
$definebone "bone_L_mouthC" "bone_L_mouthB" 1.245389 0.314888 5.125565 0 0 0 0 0 0 0 0 0
$definebone "bone_R_mouthA" "bone_jawC" 3.13924 16.756668 -2.41954 0 0 0 0 0 0 0 0 0
$definebone "bone_R_mouthB" "bone_R_mouthA" 1.048141 10.396614 5.378922 0 0 0 0 0 0 0 0 0
$definebone "bone_R_mouthC" "bone_R_mouthB" -1.245344 0.315247 5.125732 0 0 0.00001 0 0 0 0 0 0
$definebone "bone_L_cheek" "bone_skull" -11.481222 30.75605 -31.164169 0 0 0 0 0 0 0 0 0
$definebone "bone_L_head_tentacleA" "bone_skull" -9.349257 9.566124 21.932892 0 0 0 0 0 0 0 0 0
$definebone "bone_L_head_tentacleB" "bone_L_head_tentacleA" -6.159887 -18.212257 12.345245 0 0 0 0 0 0 0 0 0
$definebone "bone_L_head_tentacleC" "bone_L_head_tentacleB" -4.231217 -14.97488 11.59314 0 0 0 0 0 0 0 0 0
$definebone "bone_L_temple_tentacleA" "bone_skull" -15.638609 -3.513657 13.517151 0 0 0 0 0 0 0 0 0
$definebone "bone_L_temple_tentacleB" "bone_L_temple_tentacleA" -14.526072 -11.624916 4.912872 0 0 -0.00002 0 0 0 0 0 0
$definebone "bone_L_temple_tentacleC" "bone_L_temple_tentacleB" -13.126614 -10.042023 4.338898 0 0 0.00002 0 0 0 0 0 0
$definebone "bone_L_temple_tentacleD" "bone_L_temple_tentacleC" -9.546024 -6.90052 2.049194 0 0 0 0 0 0 0 0 0
$definebone "bone_L_throat_tentacleA" "bone_skull" -9.725936 7.400421 -30.30899 0 0 0 0 0 0 0 0 0
$definebone "bone_L_throat_tentacleB" "bone_L_throat_tentacleA" -10.037499 -2.110161 -20.771286 0 0 0 0 0 0 0 0 0
$definebone "bone_L_throat_tentacleC" "bone_L_throat_tentacleB" -12.025448 -2.143707 -18.67395 0 0 0 0 0 0 0 0 0
$definebone "bone_L_throat_tentacleD" "bone_L_throat_tentacleC" -10.5457 -2.436768 -17.7612 0 0 0 0 0 0 0 0 0
$definebone "bone_L_throat_tentacleTIP" "bone_L_throat_tentacleD" -10.155003 -2.346214 -17.103058 0 0 0 0 0 0 0 0 0
$definebone "bone_nose" "bone_skull" 0 39.772179 -21.924332 0 0 0 0 0 0 0 0 0
$definebone "bone_L_front_tentacleA" "bone_nose" -5.369464 3.47197 -7.310059 0 0 -0.00002 0 0 0 0 0 0
$definebone "bone_L_front_tentacleB" "bone_L_front_tentacleA" -6.739871 0.892204 -20.665375 0 0 0 0 0 0 0 0 0
$definebone "bone_L_front_tentacleC" "bone_L_front_tentacleB" -4.061596 1.137978 -16.112625 0 0 0 0 0 0 0 0 0
$definebone "bone_L_front_tentacleD" "bone_L_front_tentacleC" -2.410244 0.663315 -15.027527 0 0 0 0 0 0 0 0 0
$definebone "bone_L_front_tentacleE" "bone_L_front_tentacleD" -0.202805 0.44677 -16.445648 0 -0.000001 0 0 0 0 0 0 0
$definebone "bone_R_front_tentacleA" "bone_nose" 5.369557 3.471519 -7.310349 0 0 -0.00002 0 0 0 0 0 0
$definebone "bone_R_front_tentacleB" "bone_R_front_tentacleA" 6.739921 0.892456 -20.665558 0 0 0 0 0 0 0 0 0
$definebone "bone_R_front_tentacleC" "bone_R_front_tentacleB" 4.061829 1.138092 -16.112625 0 0 0 0 0 0 0 0 0
$definebone "bone_R_front_tentacleD" "bone_R_front_tentacleC" 2.410179 0.662834 -15.027573 0 0 0 0 0 0 0 0 0
$definebone "bone_R_front_tentacleE" "bone_R_front_tentacleD" 0.203074 0.446877 -16.445908 0 0.000001 0 0 0 0 0 0 0
$definebone "bone_R_cheek" "bone_skull" 11.481319 30.756088 -31.164246 0 0 0 0 0 0 0 0 0
$definebone "bone_R_head_tentacleA" "bone_skull" 9.349292 9.566185 21.932922 0 0 0 0 0 0 0 0 0
$definebone "bone_R_head_tentacleB" "bone_R_head_tentacleA" 6.160996 -18.2118 12.344116 0 0 0 0 0 0 0 0 0
$definebone "bone_R_head_tentacleC" "bone_R_head_tentacleB" 4.232307 -14.975121 11.59259 0 0 0 0 0 0 0 0 0
$definebone "bone_R_temple_tentacleA" "bone_skull" 15.638667 -3.51368 13.51712 0 0 0 0 0 0 0 0 0
$definebone "bone_R_temple_tentacleB" "bone_R_temple_tentacleA" 14.526242 -11.624748 4.913422 0 0 0 0 0 0 0 0 0
$definebone "bone_R_temple_tentacleC" "bone_R_temple_tentacleB" 13.139225 -10.051754 4.278259 0 0 0 0 0 0 0 0 0
$definebone "bone_R_temple_tentacleD" "bone_R_temple_tentacleC" 9.302692 -7.249584 1.962891 0 0 0 0 0 0 0 0 0
$definebone "bone_R_throat_tentacleA" "bone_skull" 9.726236 7.400551 -30.309204 0 0 0 0 0 0 0 0 0
$definebone "bone_R_throat_tentacleB" "bone_R_throat_tentacleA" 10.036985 -2.109406 -20.770813 0 0 0 0 0 0 0 0 0
$definebone "bone_R_throat_tentacleC" "bone_R_throat_tentacleB" 12.025017 -2.143562 -18.672699 0 0 0 0 0 0 0 0 0
$definebone "bone_R_throat_tentacleD" "bone_R_throat_tentacleC" 10.545303 -2.436806 -17.760727 0 0 -0.000039 0 0 0 0 0 0
$definebone "bone_R_throat_tentacleTIP" "bone_R_throat_tentacleD" 10.154556 -2.346397 -17.102814 0 0 0.000039 0 0 0 0 0 0
$definebone "bone_L_back_start" "bone_chest" -11.68213 53.943432 45.022858 0 0 0 0 0 0 0 0 0
$definebone "bone_L_backA" "bone_L_back_start" -2.011556 -12.0112 3.583374 0 0 0 0 0 0 0 0 0
$definebone "bone_L_backB" "bone_L_backA" -5.383539 -22.78318 18.909851 0 0 0 0 0 0 0 0 0
$definebone "bone_L_backC" "bone_L_backB" -0.506109 -19.669624 19.04718 0 0 0 0 0 0 0 0 0
$definebone "bone_L_backD" "bone_L_backC" -0.503908 -17.588987 16.14093 0 0 0 0 0 0 0 0 0
$definebone "bone_L_backE" "bone_L_backD" -0.217958 -15.455317 14.513397 0 0 0 0 0 0 0 0 0
$definebone "bone_L_clav" "bone_chest" -9.5574 42.187771 -15.644043 0 0 0 0 0 0 0 0 0
$definebone "bone_L_uparm" "bone_L_clav" -16.422812 -2.876804 8.403778 0 0 0 0 0 0 0 0 0
$definebone "bone_L_forearm" "bone_L_uparm" -47.044006 -12.129276 -74.970886 0 0 0 0 0 0 0 0 0
$definebone "bone_L_hand" "bone_L_forearm" -37.005814 78.766029 -84.459488 0 0 0 0 0 0 0 0 0
$definebone "bone_L_indexA" "bone_L_hand" -5.291008 24.994377 -25.714287 0 0 0 0 0 0 0 0 0
$definebone "bone_L_indexB" "bone_L_indexA" -0.522827 12.188873 -7.640739 0 -0.000004 0 0 0 0 0 0 0
$definebone "bone_L_indexC" "bone_L_indexB" -1.219902 22.681778 -12.712299 0 0.000005 0 0 0 0 0 0 0
$definebone "bone_L_indexD" "bone_L_indexC" -2.166412 16.824768 1.760832 0 0 0 0 0 0 0 0 0
$definebone "bone_L_indexE" "bone_L_indexD" 0.180115 14.588043 4.076229 0 0 0 0 0 0 0 0 0
$definebone "bone_L_indexTIP" "bone_L_indexE" 0.624016 9.117752 0.222578 0 0 0 0 0 0 0 0 0
$definebone "bone_L_middleA" "bone_L_hand" -10.769974 27.739662 -32.675915 0 0 0 0 0 0 0 0 0
$definebone "bone_L_middleB" "bone_L_middleA" -7.145813 8.433197 -9.213686 0 0 0 0 0 0 0 0 0
$definebone "bone_L_middleC" "bone_L_middleB" -7.46373 7.552368 -7.008379 0 0 0 0 0 0 0 0 0
$definebone "bone_L_middleD" "bone_L_middleC" -9.52713 8.091263 -3.764528 0 0.00002 0 0 0 0 0 0 0
$definebone "bone_L_middleTIP" "bone_L_middleD" -8.534958 9.999573 0.325573 0 -0.00002 0 0 0 0 0 0 0
$definebone "bone_L_pinkyCUP" "bone_L_hand" -11.931572 6.890419 -20.583939 0 0 0 0 0 0 0 0 0
$definebone "bone_L_pinkyA" "bone_L_pinkyCUP" -5.236992 14.752556 -15.189548 0 0 0 0 0 0 0 0 0
$definebone "bone_L_pinkyB" "bone_L_pinkyA" -7.602615 3.683731 -7.970024 0 0 0 0 0 0 0 0 0
$definebone "bone_L_pinkyC" "bone_L_pinkyB" -10.301086 4.604134 -7.215252 0 0 0 0 0 0 0 0 0
$definebone "bone_L_pinkyTIP" "bone_L_pinkyC" -7.138245 3.085114 -2.625508 0 0 0 0 0 0 0 0 0
$definebone "bone_L_thumbCUP" "bone_L_hand" 3.203377 11.128365 -22.264042 0 0 0 0 0 0 0 0 0
$definebone "bone_L_thumbA" "bone_L_thumbCUP" 10.51577 0.318825 -12.716217 0 0 0 0 0 0 0 0 0
$definebone "bone_L_thumbTIP" "bone_L_thumbA" 13.843155 0.284111 -8.488792 0 0 0 0 0 0 0 0 0
$definebone "bone_L_thumbB" "bone_L_thumbTIP" 9.469231 0.851082 -4.685125 0 0 0 0 0 0 0 0 0
$definebone "bone_pec_center" "bone_chest" 0 50.218182 -37.273727 0 0 0 0 0 0 0 0 0
$definebone "bone_L_pectoral" "bone_pec_center" 0.000045 1.855228 -1.111084 0 0 0 0 0 0 0 0 0
$definebone "bone_R_pectoral" "bone_pec_center" 0.000028 1.855324 -1.111115 0 0 0 0 0 0 0 0 0
$definebone "bone_R_back_start" "bone_chest" 11.681912 53.943287 45.022675 0 0 0 0 0 0 0 0 0
$definebone "bone_R_backA" "bone_R_back_start" 2.012219 -12.010998 3.582611 0 0 0 0 0 0 0 0 0
$definebone "bone_R_backB" "bone_R_backA" 5.384916 -22.783127 18.910278 0 0 0 0 0 0 0 0 0
$definebone "bone_R_backC" "bone_R_backB" 0.506763 -19.670237 19.047546 0 0 0 0 0 0 0 0 0
$definebone "bone_R_backD" "bone_R_backC" 0.504732 -17.589338 16.141693 0 0 0 0 0 0 0 0 0
$definebone "bone_R_backE" "bone_R_backD" 0.21843 -15.456337 14.514435 0 0 0 0 0 0 0 0 0
$definebone "bone_R_clav" "bone_chest" 9.557401 42.187874 -15.644196 0 0 0 0 0 0 0 0 0
$definebone "bone_R_uparm" "bone_R_clav" 16.422821 -2.876694 8.403748 0 0 0 0 0 0 0 0 0
$definebone "bone_R_forearm" "bone_R_uparm" 47.041721 -12.126713 -74.968231 0 0 0 0 0 0 0 0 0
$definebone "bone_R_hand" "bone_R_forearm" 37.012573 78.763847 -84.451851 0 0 0 0 0 0 0 0 0
$definebone "bone_R_indexA" "bone_R_hand" 5.290184 24.995979 -25.711437 0 0 0 0 0 0 0 0 0
$definebone "bone_R_indexB" "bone_R_indexA" 0.522636 12.189957 -7.640209 0 -0.000004 0 0 0 0 0 0 0
$definebone "bone_R_indexC" "bone_R_indexB" 1.219635 22.683014 -12.71014 0 0.000007 0 0 0 0 0 0 0
$definebone "bone_R_indexD" "bone_R_indexC" 2.166138 16.825302 1.762585 0 0 0 0 0 0 0 0 0
$definebone "bone_R_indexE" "bone_R_indexD" -0.210701 14.586853 4.081749 0 -0.000003 0 0 0 0 0 0 0
$definebone "bone_R_indexTIP" "bone_R_indexE" -0.642189 9.116821 0.225702 0 0 0.000001 0 0 0 0 0 0
$definebone "bone_R_middleA" "bone_R_hand" 10.769402 27.741356 -32.672291 0 0 0 0 0 0 0 0 0
$definebone "bone_R_middleB" "bone_R_middleA" 7.14576 8.433487 -9.213058 0 0 0 0 0 0 0 0 0
$definebone "bone_R_middleC" "bone_R_middleB" 7.463654 7.552444 -7.00721 0 -0.00002 0 0 0 0 0 0 0
$definebone "bone_R_middleD" "bone_R_middleC" 9.526886 8.091293 -3.763586 0 0.00002 0 0 0 0 0 0 0
$definebone "bone_R_middleTIP" "bone_R_middleD" 8.534698 9.999771 0.326405 0 0 0 0 0 0 0 0 0
$definebone "bone_R_pinkyCUP" "bone_R_hand" 11.931808 6.890587 -20.581806 0 0 0 0 0 0 0 0 0
$definebone "bone_R_pinkyA" "bone_R_pinkyCUP" 5.236923 14.75383 -15.18771 0 0 0 0 0 0 0 0 0
$definebone "bone_R_pinkyB" "bone_R_pinkyA" 7.602615 3.683723 -7.969278 0 0 0 0 0 0 0 0 0
$definebone "bone_R_pinkyC" "bone_R_pinkyB" 10.301392 4.604424 -7.214659 0 0 0 0 0 0 0 0 0
$definebone "bone_R_pinkyTIP" "bone_R_pinkyC" 7.138824 3.085403 -2.625059 0 0 0 0 0 0 0 0 0
$definebone "bone_R_thumbCUP" "bone_R_hand" -3.204094 11.128899 -22.262138 0 0 0 0 0 0 0 0 0
$definebone "bone_R_thumbA" "bone_R_thumbCUP" -10.54364 0.330261 -12.692688 0 0 0 0 0 0 0 0 0
$definebone "bone_R_thumbTIP" "bone_R_thumbA" -13.861931 0.294922 -8.457941 0 0 0 0 0 0 0 0 0
$definebone "bone_R_thumbB" "bone_R_thumbTIP" -9.47934 0.857887 -4.663832 0 0 0 0 0 0 0 0 0
$definebone "bone_R_wing_base" "bone_chest" 26.887053 30.789274 30.969299 0 0 0 0 0 0 0 0 0
$definebone "bone_R_wingA" "bone_R_wing_base" 8.114824 -0.762516 6.662415 0 0 0 0 0 0 0 0 0
$definebone "bone_R_wingA2" "bone_R_wingA" 29.016693 -9.952842 -0.006653 0 0 0 0 0 0 0 0 0
$definebone "bone_R_wingB" "bone_R_wingA2" 23.434952 -14.632246 0.395264 0 0 0 0 0 0 0 0 0
$definebone "bone_R_wingB2" "bone_R_wingB" 15.132034 -10.752118 13.823151 0 0 0 0 0 0 0 0 0
$definebone "bone_R_wingC" "bone_R_wingB2" 54.827698 -48.550499 54.981812 0 0 0 0 0 0 0 0 0
$definebone "bone_R_wingD" "bone_R_wingC" 60.447006 -58.455517 -37.115845 0 0 0 0 0 0 0 0 0
$definebone "bone_R_wingE" "bone_R_wingD" 48.833344 -47.305939 -31.92041 0 0 0 0 0 0 0 0 0
$definebone "bone_sternum" "bone_chest" 0 27.899117 -48.412567 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_indexC" "bone_L_toe_indexB" 1.837936 10.409658 4.403242 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_middleC" "bone_L_toe_middleB" -1.876179 12.466313 2.315666 0 0 0 0 0 0 0 0 0
$definebone "bone_L_toe_thumbC" "bone_L_toe_thumbB" 2.805603 -12.994957 1.767395 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_indexC" "bone_R_toe_indexB" -1.838551 10.393989 4.431933 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_middleC" "bone_R_toe_middleB" 1.840389 12.461725 2.35152 0 0 0 0 0 0 0 0 0
$definebone "bone_R_toe_thumbC" "bone_R_toe_thumbB" -2.728939 -13.012192 1.728062 0 -0.000005 0 0 0 0 0 0 0
$definebone "bone_tail01" "bone_pelvis" 0 -20.18639 -7.370453 0 0 0 0 0 0 0 0 0
$definebone "bone_tail02" "bone_tail01" 0 -70.96965 -29.086288 0 0 0 0 0 0 0 0 0
$definebone "bone_tail03" "bone_tail02" 0 -49.099854 -16.109863 0 0 0 0 0 0 0 0 0
$definebone "bone_tail04" "bone_tail03" 0 -53.878052 -19.223618 0 0 0 0 0 0 0 0 0
$definebone "bone_L_forkA" "bone_tail04" -5.878856 -31.083405 -11.090599 0 0 0 0 0 0 0 0 0
$definebone "bone_L_forkB" "bone_L_forkA" -6.238051 -44.197052 -15.76989 0 0 0 0 0 0 0 0 0
$definebone "bone_R_forkB" "bone_L_forkA" 17.995516 -44.195679 -15.769257 0 0 0 0 0 0 0 0 0
$definebone "bone_R_forkA" "bone_tail04" 5.878855 -31.083405 -11.090614 0 0 0 0 0 0 0 0 0
$definebone "bone_L_wing_base" "bone_chest" -26.887115 30.789379 30.969299 0 0 0 0 0 0 0 0 0
$definebone "bone_L_wingA" "bone_L_wing_base" -8.114433 -0.76276 6.662689 0 0 0 0 0 0 0 0 0
$definebone "bone_L_wingA2" "bone_L_wingA" -29.016991 -9.952725 -0.088409 0 0 0 0 0 0 0 0 0
$definebone "bone_L_wingB" "bone_L_wingA2" -23.436073 -14.632466 0.326599 0 0 0 0 0 0 0 0 0
$definebone "bone_L_wingB2" "bone_L_wingB" -15.166512 -10.764298 13.776703 0 0 0 0 0 0 0 0 0
$definebone "bone_L_wingC" "bone_L_wingB2" -54.964722 -48.596985 54.806671 0 0 0 0 0 0 0 0 0
$definebone "bone_L_wingC_claw" "bone_L_wingC" -0.220245 1.825119 3.416382 0 0 0 0 0 0 0 0 0
$definebone "bone_L_wingD" "bone_L_wingC" -60.35463 -58.42305 -37.313171 0 0 0 0 0 0 0 0 0
$definebone "bone_L_wingE" "bone_L_wingD" -48.753769 -47.278885 -32.079193 0 0 0 0 0 0 0 0 0
$definebone "bone_L_wingTIP" "bone_L_wingE" -37.256805 -41.22348 -29.448456 0 0 0 0 0 0 0 0 0
$definebone "bone_R_wingC_claw" "bone_R_wingC" 0.211578 1.827824 3.415466 0 0 0 0 0 0 0 0 0
$definebone "bone_R_wingTIP" "bone_R_wingE" 37.330841 -41.249237 -29.322235 0 0 0 0 0 0 0 0 0


$sequence "BindPose" {
	"krakenelderstage3_anims\BindPose.smd"
	fadein 0.2
	fadeout 0.2
	fps 30
}
