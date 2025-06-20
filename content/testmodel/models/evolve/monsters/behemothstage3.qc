// Created by Crowbar 0.67

$modelname "evolve\monsters\behemothstage3.mdl"

$bodygroup "Behemoth"
{
	studio "rocky3.smd"
}
$bodygroup "clamped1"
{
	studio "body1_model0.smd"
}


$surfaceprop "default"

$contents "solid"

$illumposition 0.092 -26.705 141.308

$ambientboost

$mostlyopaque

$cdmaterials "models\evolve\monsters\behemoth\"
$cdmaterials ""

$texturegroup "skinfamilies"
{
	{ "Behemoth_Lower"        "Behemoth_Upper"        "Behemoth_Stages"        }
	{ "behemoth_lower_damage" "behemoth_upper_damage" "behemoth_stages_damage" }
}

$cbox 0 0 0 0 0 0

$bbox -192.936 -314.114 -31.212 246.346 314.299 313.828

$definebone "Bip_01" "" 0 0 0 0 0 0 0 0 0 0 0 0
$definebone "bone_root" "Bip_01" -0.000005 -54.955399 124.261299 0 0 0 0 0 0 0 0 0
$definebone "bone_pelvis" "bone_root" 0.000005 1.305401 -8.36129 -1.13207 -0.303115 -150.021745 0 0 0 0 0 0
$definebone "bone_l_hip" "bone_pelvis" -22.417492 7.086331 0.875282 -1.578361 -0.467562 149.953279 0 0 0 0 0 0
$definebone "bone_l_hipplate" "bone_l_hip" 5.336807 -10.283119 14.308159 -0.000394 -0.895174 -0.000004 0 0 0 0 0 0
$definebone "bone_l_thigh" "bone_l_hip" -17.644798 -3.949684 -3.625839 0.001185 -1.193483 0.298344 0 0 0 0 0 0
$definebone "bone_l_calf" "bone_l_thigh" -6.212353 14.49968 -39.089424 0 0.311387 -0.000004 0 0 0 0 0 0
$definebone "bone_l_foot" "bone_l_calf" -1.587948 -24.11705 -43.487419 0 0 -0.000004 0 0 0 0 0 0
$definebone "bone_l_toe_back_01" "bone_l_foot" 11.583443 -14.978287 -14.820558 0 0 -0.000004 0 0 0 0 0 0
$definebone "bone_l_toe_back_02" "bone_l_toe_back_01" 0.252625 -7.097412 -2.786113 0.000022 0 -0.149212 0 0 0 0 0 0
$definebone "bone_l_toe_inner_01" "bone_l_foot" 25.724691 9.926296 -14.898008 0 0 -0.000004 0 0 0 0 0 0
$definebone "bone_l_toe_inner_02" "bone_l_toe_inner_01" 5.01832 2.230278 -2.314063 0.000022 0 -0.149212 0 0 0 0 0 0
$definebone "bone_l_toe_mid_01" "bone_l_foot" 0.908741 26.506424 -14.126312 0 0 -0.000004 0 0 0 0 0 0
$definebone "bone_l_toe_mid_02" "bone_l_toe_mid_01" -1.102676 10.131779 -2.197846 0.000045 0 -0.311391 0 0 0 0 0 0
$definebone "bone_l_toe_outer_01" "bone_l_foot" -15.804802 6.509109 -14.900664 0 0 -0.000004 0 0 0 0 0 0
$definebone "bone_l_toe_outer_02" "bone_l_toe_outer_01" -11.408108 7.621334 -2.449975 0.000022 0 -0.149212 0 0 0 0 0 0
$definebone "bone_l_knee" "bone_l_thigh" -6.212303 14.499763 -39.089523 0 0.311387 -0.000004 0 0 0 0 0 0
$definebone "bone_l_kneeInner" "bone_l_thigh" -6.212261 14.49984 -39.089508 0 0.311387 -0.000004 0 0 0 0 0 0
$definebone "bone_r_hip" "bone_pelvis" 22.289539 7.322813 1.758636 -1.571959 -0.465665 150.249805 0 0 0 0 0 0
$definebone "bone_r_hipplate" "bone_r_hip" -5.652105 -10.03878 14.36042 -0.000386 -0.895174 -0.000001 0 0 0 0 0 0
$definebone "bone_r_thigh" "bone_r_hip" 17.513491 -4.513317 -3.60376 -0.00199 -1.19348 -0.298349 0 0 0 0 0 0
$definebone "bone_r_knee" "bone_r_thigh" 6.055367 14.769753 -39.012909 0 0.311387 -0.000001 0 0 0 0 0 0
$definebone "bone_r_kneeInner" "bone_r_thigh" 6.055347 14.769718 -39.012878 0 0.311387 -0.000001 0 0 0 0 0 0
$definebone "bone_r_calf" "bone_r_thigh" 6.055347 14.769707 -39.012894 0 0.311387 -0.000001 0 0 0 0 0 0
$definebone "bone_r_foot" "bone_r_calf" 1.583984 -23.88953 -43.612965 0 0 -0.000001 0 0 0 0 0 0
$definebone "bone_r_toe_back_01" "bone_r_foot" -11.564983 -14.92086 -14.896213 0 0 -0.000001 0 0 0 0 0 0
$definebone "bone_r_toe_back_02" "bone_r_toe_back_01" -0.254848 -7.08316 -2.82194 0.000039 -0.018651 0.149206 0 0 0 0 0 0
$definebone "bone_r_toe_inner_01" "bone_r_foot" -25.694456 9.990414 -14.85308 0 0 -0.000001 0 0 0 0 0 0
$definebone "bone_r_toe_inner_02" "bone_r_toe_inner_01" -5.016407 2.244362 -2.304655 -0.000009 0 0.149206 0 0 0 0 0 0
$definebone "bone_r_toe_mid_01" "bone_r_foot" -0.870975 26.554661 -13.987828 0 0 -0.000001 0 0 0 0 0 0
$definebone "bone_r_toe_mid_02" "bone_r_toe_mid_01" 0.47953 10.191387 -2.146279 0 0 -0.000001 0 0 0 0 0 0
$definebone "bone_r_toe_outer_01" "bone_r_foot" 15.833561 6.553482 -14.856793 0 0 -0.000001 0 0 0 0 0 0
$definebone "bone_r_toe_outer_02" "bone_r_toe_outer_01" 11.412674 7.628189 -2.407057 0.001545 -0.596806 0.149198 0 0 0 0 0 0
$definebone "bone_tail_base" "bone_pelvis" 0.285113 20.021809 -19.784416 -1.127585 0.310777 149.650715 0 0 0 0 0 0
$definebone "bone_tail_01" "bone_tail_base" 0.003495 -22.929634 -3.496994 -0.000001 0.009034 0.298415 0 0 0 0 0 0
$definebone "bone_tail_02" "bone_tail_01" -0.000078 -36.813431 -23.349686 0 -0.000164 0.000002 0 0 0 0 0 0
$definebone "bone_tail_03" "bone_tail_02" -0.000168 -26.590836 -16.748657 0 0 0.000002 0 0 0 0 0 0
$definebone "bone_tail_04" "bone_tail_03" -0.000158 -23.745575 -11.21167 0 0.000009 0.000002 0 0 0 0 0 0
$definebone "bone_spine_01" "bone_root" 0.000005 -11.963745 20.017509 0 0 0 0 0 0 0 0 0
$definebone "bone_l_backplate_low01" "bone_spine_01" -55.198677 -3.034012 30.032135 0 0 0 0 0 0 0 0 0
$definebone "bone_l_backplate_low02" "bone_spine_01" -24.0256 -41.515915 10.9375 0 0 0 0 0 0 0 0 0
$definebone "bone_r_backplate_low01" "bone_spine_01" 53.269512 -2.840569 27.808899 0 0 0 0 0 0 0 0 0
$definebone "bone_r_backplate_low02" "bone_spine_01" 24.236689 -37.637169 12.043579 0 0 0 0 0 0 0 0 0
$definebone "bone_spine_02" "bone_spine_01" 0.00017 18.763599 25.928375 0 0 0 0 0 0 0 0 0
$definebone "bone_l_backplate_high" "bone_spine_02" -65.951797 -7.939133 33.228577 0 0 0 0 0 0 0 0 0
$definebone "bone_l_backplate_mid01" "bone_spine_02" -47.697651 -9.923283 41.443069 0 0 0 0 0 0 0 0 0
$definebone "bone_l_backplate_mid02" "bone_spine_02" -49.253273 -18.744198 26.421844 0 0 0 0 0 0 0 0 0
$definebone "bone_l_ribs_01" "bone_spine_02" -61.478592 40.404198 -38.457245 0 0 0 0 0 0 0 0 0
$definebone "bone_r_backplate_high" "bone_spine_02" 59.18824 -9.746952 43.477066 0 0 0 0 0 0 0 0 0
$definebone "bone_r_backplate_mid01" "bone_spine_02" 45.368935 -15.819649 40.612808 0 0 0 0 0 0 0 0 0
$definebone "bone_r_backplate_mid02" "bone_spine_02" 53.316998 -15.618877 17.856232 0 0 0 0 0 0 0 0 0
$definebone "bone_r_ribs_01" "bone_spine_02" 62.162609 42.803387 -39.28595 0 0 0 0 0 0 0 0 0
$definebone "bone_spine_03" "bone_spine_02" -0.000014 24.565828 23.408905 0 0 0 0 0 0 0 0 0
$definebone "bone_l_backplate_shoulder" "bone_spine_03" -80.832352 -1.029358 28.050858 0 0 0 0 0 0 0 0 0
$definebone "bone_l_ribs_02" "bone_spine_03" -58.130489 52.594139 -33.298325 0 0 0 0 0 0 0 0 0
$definebone "bone_l_ribs_03" "bone_spine_03" -51.973057 57.040443 -21.948395 0 0 0 0 0 0 0 0 0
$definebone "bone_r_backplate_shoulder" "bone_spine_03" 78.157898 -1.282898 32.542313 0 0 0 0 0 0 0 0 0
$definebone "bone_r_ribs_02" "bone_spine_03" 45.872967 67.10675 -21.454422 0 0 0 0 0 0 0 0 0
$definebone "bone_r_ribs_03" "bone_spine_03" 46.078281 59.058006 -25.250305 0 0 0 0 0 0 0 0 0
$definebone "bone_spine_04" "bone_spine_03" 0.000003 32.947655 15.199142 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_Root" "bone_spine_04" 3.416422 6.174805 -69.783279 0 0 0 0 0 0 0 0 0
$definebone "bone_heart_01" "bone_Intestine_Root" -13.614395 61.326469 5.224091 0 0 0 0 0 0 0 0 0
$definebone "bone_heart_02" "bone_Intestine_Root" 2.783818 57.88562 5.612991 0 0 0 0 0 0 0 0 0
$definebone "bone_heart_03" "bone_Intestine_Root" -9.512101 56.071198 -8.733154 0 0 0 0 0 0 0 0 0
$definebone "bone_heart_04" "bone_Intestine_Root" 4.555268 51.550003 -7.135513 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_05" "bone_Intestine_Root" -4.376451 43.015709 -25.768913 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_06" "bone_Intestine_Root" -32.091175 39.853783 -19.190506 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_07" "bone_Intestine_Root" 22.65889 38.043045 -19.177139 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_11" "bone_Intestine_Root" 41.909008 13.120363 21.108978 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_12" "bone_Intestine_Root" 3.213239 16.033831 -55.008423 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_13" "bone_Intestine_Root" -24.33246 20.862238 -38.361237 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_14" "bone_Intestine_Root" 27.767546 10.074574 -31.859192 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_15" "bone_Intestine_Root" -35.687698 -1.846172 -34.776657 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_16" "bone_Intestine_Root" -9.988565 -5.970928 -57.529526 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_17" "bone_Intestine_Root" 28.353357 -5.196333 -42.805298 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_18" "bone_Intestine_Root" -25.592821 4.745945 -25.070847 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_19" "bone_Intestine_Root" 5.288973 21.776598 -33.250999 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_20" "bone_Intestine_Root" -35.355385 -1.344037 19.870682 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_22" "bone_Intestine_Root" -0.000031 29.985819 0.000183 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_lower01" "bone_Intestine_Root" 17.923756 -23.404711 -52.571678 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_lower02" "bone_Intestine_Root" 0.15336 3.604639 -74.446724 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_lower03" "bone_Intestine_Root" -9.309981 29.339258 -51.634003 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_lower04" "bone_Intestine_Root" 30.103003 -31.873638 7.083817 0 0 0 0 0 0 0 0 0
$definebone "bone_l_backplate_uppershoulder" "bone_spine_04" 2.445795 19.604519 35.396164 0 0 0 0 0 0 0 0 0
$definebone "bone_l_clavicle" "bone_spine_04" -28.041161 56.29718 -11.657471 0 0 0 0 0 0 0 0 0
$definebone "bone_l_upperarm" "bone_l_clavicle" -44.042007 -23.077339 23.114716 0 0 0 0 0 0 0 0 0
$definebone "bone_l_forearm" "bone_l_upperarm" -87.443512 6.308239 -34.18988 0 0 0 0 0 0 0 0 0
$definebone "bone_l_forearm_twist" "bone_l_forearm" -0.000031 0.000099 -0.000168 0 0 0 0 0 0 0 0 0
$definebone "bone_l_gauntlet_back_outer" "bone_l_forearm_twist" -45.731476 -8.647884 -40.808624 0 0 0 0 0 0 0 0 0
$definebone "bone_l_gauntlet_inner" "bone_l_forearm_twist" -33.895203 13.129391 -67.606735 0 0 0 0 0 0 0 0 0
$definebone "bone_l_gauntlet_inner_back" "bone_l_forearm_twist" -26.472977 -4.121727 -35.252441 0 0 0 0 0 0 0 0 0
$definebone "bone_l_shoulder" "bone_l_upperarm" 0.000038 0.000111 -0.000076 0 0 0 0 0 0 0 0 0
$definebone "bone_l_ribs_04" "bone_spine_04" -51.077724 32.943314 -31.556778 0 0 0 0 0 0 0 0 0
$definebone "bone_neck_01" "bone_spine_04" 0.000266 42.871071 5.982285 0 0 0 0 0 0 0 0 0
$definebone "bone_neck_02" "bone_neck_01" -0.000036 25.145088 1.355362 0 0 0 0 0 0 0 0 0
$definebone "bone_head_outer" "bone_neck_02" -0.000242 16.58271 1.81012 0 0 0 0 0 0 0 0 0
$definebone "bone_foreheadplate" "bone_head_outer" -0.00005 -0.000008 0.000046 0 0 0 0 0 0 0 0 0
$definebone "bone_l_cheekplate" "bone_head_outer" -0.000014 0.000069 0.000168 0 0 0 0 0 0 0 0 0
$definebone "bone_l_eyeplate" "bone_head_outer" 0.000062 0.000122 0.000076 0 0 0 0 0 0 0 0 0
$definebone "bone_r_cheekplate" "bone_head_outer" 1.338698 -5.607086 -0.012756 0 0 0 0 0 0 0 0 0
$definebone "bone_r_eyeplate" "bone_head_outer" 0.000162 -0.000069 0.000076 0 0 0 0 0 0 0 0 0
$definebone "bone_r_backplate_uppershoulder" "bone_spine_04" -2.457717 19.604769 35.396378 0 0 0 0 0 0 0 0 0
$definebone "bone_r_clavicle" "bone_spine_04" 28.041643 56.297226 -11.657318 0 0 0 0 0 0 0 0 0
$definebone "bone_r_upperarm" "bone_r_clavicle" 44.041679 -23.077263 23.114838 0 0 0 0 0 0 0 0 0
$definebone "bone_r_forearm" "bone_r_upperarm" 87.443863 6.308456 -34.188736 0 0 0 0 0 0 0 0 0
$definebone "bone_r_forearm_twist" "bone_r_forearm" 0.000031 0.000046 -0.000137 0 0 0 0 0 0 0 0 0
$definebone "bone_r_gauntlet_back_inner" "bone_r_forearm_twist" 26.472366 -4.122948 -35.253738 0 0 0 0 0 0 0 0 0
$definebone "bone_r_gauntlet_back_outer" "bone_r_forearm_twist" 45.730469 -8.650036 -40.810104 0 0 0 0 0 0 0 0 0
$definebone "bone_r_gauntlet_inner" "bone_r_forearm_twist" 33.895599 13.130466 -67.60601 0 0 0 0 0 0 0 0 0
$definebone "bone_r_shoulder" "bone_r_upperarm" -0.000038 0.000027 -0.000122 0 0 0 0 0 0 0 0 0
$definebone "bone_r_ribs_04" "bone_spine_04" 46.389435 31.033236 -27.853409 0 0 0 0 0 0 0 0 0
$definebone "bone_Intestine_21" "bone_Intestine_Root" -36.571682 33.290504 9.087341 0 0 0 0 0 0 0 0 0
$definebone "bone_l_armpitPlate" "bone_l_upperarm" 21.847137 39.403435 -35.871353 0 0 0 0 0 0 0 0 0
$definebone "bone_l_gauntlet_outer" "bone_l_forearm_twist" -31.437225 11.732376 -26.830353 0 0 0 0 0 0 0 0 0
$definebone "bone_l_hand" "bone_l_forearm" -47.747925 0.983219 -66.200813 0 0 0 0 0 0 0 0 0
$definebone "bone_l_hand_extend" "bone_l_hand" -5.533646 1.227524 -8.741005 0 0 0 0 0 0 0 0 0
$definebone "bone_l_finger_back_01" "bone_l_hand_extend" -2.804047 -24.291662 -1.104233 0 0 0 0 0 0 0 0 0
$definebone "bone_l_finger_back_02" "bone_l_finger_back_01" -7.769104 -13.453123 -5.388222 0 0 0 0 0 0 0 0 0
$definebone "bone_l_finger_back_03" "bone_l_finger_back_02" -9.550522 -14.594097 -5.229446 0 0 0 0 0 0 0 0 0
$definebone "bone_l_finger_inner_01" "bone_l_hand_extend" 11.005142 5.178665 -10.69429 0 0 0 0 0 0 0 0 0
$definebone "bone_l_finger_inner_02" "bone_l_finger_inner_01" -0.908615 3.257835 -21.06134 0 0 0 0 0 0 0 0 0
$definebone "bone_l_finger_inner_03" "bone_l_finger_inner_02" -0.998489 3.872185 -24.751144 0 0 0 0 0 0 0 0 0
$definebone "bone_l_finger_outer_01" "bone_l_hand_extend" -11.487823 5.774082 10.764313 0 0 0 0 0 0 0 0 0
$definebone "bone_l_finger_outer_02" "bone_l_finger_outer_01" -17.820496 6.849758 -16.834839 0 0 0 0 0 0 0 0 0
$definebone "bone_l_finger_outer_03" "bone_l_finger_outer_02" -15.548904 6.535088 -14.123756 0 0 0 0 0 0 0 0 0
$definebone "bone_l_shoulderPlate" "bone_l_upperarm" -19.204964 5.467148 24.130005 0 0 0 0 0 0 0 0 0
$definebone "bone_l_shoulderPlate_Lower" "bone_l_shoulderPlate" 0.00013 0.000069 -0.000336 0 0 0 0 0 0 0 0 0
$definebone "bone_head" "bone_neck_02" -0.000056 16.582848 1.81012 0 0 0 0 0 0 0 0 0
$definebone "bone_jaw" "bone_head" 0.000067 -3.41806 -13.147049 0 0 0 0 0 0 0 0 0
$definebone "bone_tongue01" "bone_jaw" 0.000024 -0.550896 -12.511124 0 0 0 0 0 0 0 0 0
$definebone "bone_tongue02" "bone_tongue01" 0.001304 20.253098 8.761307 0 0 0 0 0 0 0 0 0
$definebone "bone_tongue_tip_l" "bone_tongue02" -6.999675 19.3517 -4.719879 0 0 0 0 0 0 0 0 0
$definebone "bone_tongue_tip_r" "bone_tongue02" 7.000314 19.35025 -4.722076 0 0 0 0 0 0 0 0 0
$definebone "bone_jaw_outer" "bone_head_outer" 0.000366 -7.416771 -14.844101 0 0 0 0 0 0 0 0 0
$definebone "bone_l_mouthplate" "bone_jaw_outer" -26.98251 19.473701 -10.485596 0 0 0 0 0 0 0 0 0
$definebone "bone_r_mouthplate" "bone_jaw_outer" 26.982843 19.474396 -10.48613 0 0 0 0 0 0 0 0 0
$definebone "bone_r_armpitPlate" "bone_r_upperarm" -9.158451 39.50309 -36.119263 0 0 0 0 0 0 0 0 0
$definebone "bone_r_gauntlet_outer" "bone_r_forearm_twist" 31.438019 11.730034 -26.829758 0 0 0 0 0 0 0 0 0
$definebone "bone_r_hand" "bone_r_forearm" 47.747284 0.98312 -66.201126 0 0 0 0 0 0 0 0 0
$definebone "bone_r_hand_extend" "bone_r_hand" 5.534241 1.227821 -8.740929 0 0 0 0 0 0 0 0 0
$definebone "bone_r_finger_back_01" "bone_r_hand_extend" 2.803925 -24.29187 -1.10434 0 0 0 0 0 0 0 0 0
$definebone "bone_r_finger_back_02" "bone_r_finger_back_01" 7.769043 -13.452843 -5.388191 0 0 0 0 0 0 0 0 0
$definebone "bone_r_finger_back_03" "bone_r_finger_back_02" 9.550598 -14.594069 -5.229462 0 0 0 0 0 0 0 0 0
$definebone "bone_r_finger_inner_01" "bone_r_hand_extend" -11.005539 5.178696 -10.694267 0 0 0 0 0 0 0 0 0
$definebone "bone_r_finger_inner_02" "bone_r_finger_inner_01" 0.908447 3.258045 -21.061356 0 0 0 0 0 0 0 0 0
$definebone "bone_r_finger_inner_03" "bone_r_finger_inner_02" 0.998474 3.872311 -24.751335 0 0 0 0 0 0 0 0 0
$definebone "bone_r_finger_outer_01" "bone_r_hand_extend" 11.487411 5.773987 10.764214 0 0 0 0 0 0 0 0 0
$definebone "bone_r_finger_outer_02" "bone_r_finger_outer_01" 17.820816 6.849808 -16.834747 0 0 0 0 0 0 0 0 0
$definebone "bone_r_finger_outer_03" "bone_r_finger_outer_02" 15.548584 6.535206 -14.123764 0 0 0 0 0 0 0 0 0
$definebone "bone_r_shoulderPlate" "bone_r_upperarm" 19.204796 5.467312 24.130127 0 0 0 0 0 0 0 0 0
$definebone "bone_r_shoulderPlate_Lower" "bone_r_shoulderPlate" -0.000221 -0.000137 -0.000092 0 0 0 0 0 0 0 0 0


$sequence "BindPose" {
	"behemothstage3_anims\BindPose.smd"
	fadein 0.2
	fadeout 0.2
	fps 30
}
