var mainPanel 		= $.GetContextPanel().GetParent();
var PlayerTables = GameUI.CustomUIConfig().PlayerTables;
var heroIcon = $("#HeroInfo");
var UpdateTimer = 15;
var old = {
    physical15: "0",
    magical15: "0",
    pure15: "0",
    physical60: "0",
    magical60: "0",
    pure60: "0"
};
var oldSum = {
    15: "0",
    60: "0"
}
var counter = 0;

function DamageTableUpdate(){
    var playerId = Game.GetLocalPlayerID();
    var heroId = Players.GetPlayerHeroEntityIndex(playerId);
    heroIcon.FindChildTraverse('HeroIcon').heroname = Entities.GetUnitName(heroId);
    let table = PlayerTables.GetAllTableValues("DamageTable" + playerId);
    var physical = table.Physical
    var magical = table.Magical
    var pure = table.Pure
    
    mainPanel.FindChildTraverse('PhysicalV').text = NumberReduction(physical)
    mainPanel.FindChildTraverse('MagiсalV').text = NumberReduction(magical)
    mainPanel.FindChildTraverse('PureV').text = NumberReduction(pure)

    AdditionalInfoUpdate(playerId);
}

function AdditionalInfoUpdate(playerId){
    if (UpdateTimer==15){
        mainPanel.FindChildTraverse('TimerButton1Image').SetImage("file://{resources}/images/timer_button1B.png")
        mainPanel.FindChildTraverse('TimerButton2Image').SetImage("file://{resources}/images/timer_button2A.png")
    }else{
        mainPanel.FindChildTraverse('TimerButton1Image').SetImage("file://{resources}/images/timer_button1A.png")
        mainPanel.FindChildTraverse('TimerButton2Image').SetImage("file://{resources}/images/timer_button2B.png")
    }
    let table = PlayerTables.GetAllTableValues("AdditionalTable"+ UpdateTimer + "_" + playerId);
    var physical = table.Physical
    var magical = table.Magical
    var pure = table.Pure
    
    if (!physical){
        physical = 0;
        mainPanel.FindChildTraverse('DamageBarBackground1').style.width = "0%";
    }
    if (!magical){
        magical = 0;
        mainPanel.FindChildTraverse('DamageBarBackground2').style.width	= "0%";
    }
    if (!pure){
        pure = 0;
        mainPanel.FindChildTraverse('DamageBarBackground3').style.width = "0%";
    }
    if (physical < old["physical"+UpdateTimer] || magical < old["magical"+UpdateTimer] || pure < old["pure"+UpdateTimer]){
        oldSum[UpdateTimer] = old["physical"+UpdateTimer] + old["magical"+UpdateTimer] + old["pure"+UpdateTimer]   
    } 
    mainPanel.FindChildTraverse('DamageOld').text = NumberReduction(oldSum[UpdateTimer])
    old["physical"+UpdateTimer] = physical
    old["magical"+UpdateTimer] = magical
    old["pure"+UpdateTimer] = pure

    var sum = physical + magical + pure;
    mainPanel.FindChildTraverse('DamageNew').text = NumberReduction(sum)
    if (sum == 0){
        return
    }

    mainPanel.FindChildTraverse('DamageBarBackground1').style.width = (physical/sum)*100 + "%";

    mainPanel.FindChildTraverse('DamageBarBackground2').style.width	= (magical/sum)*100+1 + "%";
    mainPanel.FindChildTraverse('DamageBarBackground2').style.marginLeft = 160*(physical/sum) + "px";
    
    mainPanel.FindChildTraverse('DamageBarBackground3').style.width = (pure/sum)*100+1 + "%";
    mainPanel.FindChildTraverse('DamageBarBackground3').style.marginLeft = 160*(physical/sum)+160*(magical/sum)   + "px";
}

function OpenDamagePanel(){
    mainPanel.FindChildTraverse('CloseButton').style.visibility = "visible"
    mainPanel.FindChildTraverse('OpenAdditionalInfoButton').style.visibility = "visible"
    mainPanel.FindChildTraverse('DamagePanel').style.visibility = "visible"
    mainPanel.FindChildTraverse('HeroInfo').style.visibility = "visible"

    mainPanel.FindChildTraverse('OpenButton').style.visibility = "collapse"
}

function CloseDamagePanel(){
    mainPanel.FindChildTraverse('OpenButton').style.visibility = "visible"

    mainPanel.FindChildTraverse('DamagePanel').style.visibility = "collapse"
    mainPanel.FindChildTraverse('CloseButton').style.visibility = "collapse"
    mainPanel.FindChildTraverse('OpenAdditionalInfoButton').style.visibility = "collapse"
    mainPanel.FindChildTraverse('AdditionalInfo').style.visibility = "collapse"
    mainPanel.FindChildTraverse('ReturnHeroInfoButton').style.visibility = "collapse"
    mainPanel.FindChildTraverse('TimerButton1').style.visibility = "collapse"
    mainPanel.FindChildTraverse('TimerButton2').style.visibility = "collapse"
}
function OpenHeroInfoPanel(){
    mainPanel.FindChildTraverse('AdditionalInfo').style.visibility = "visible"
    mainPanel.FindChildTraverse('ReturnHeroInfoButton').style.visibility = "visible"
    mainPanel.FindChildTraverse('TimerButton1').style.visibility = "visible"
    mainPanel.FindChildTraverse('TimerButton2').style.visibility = "visible"

    mainPanel.FindChildTraverse('HeroInfo').style.visibility = "collapse"
    mainPanel.FindChildTraverse('OpenAdditionalInfoButton').style.visibility = "collapse"
}
function ReturnHeroInfoPanel(){
    mainPanel.FindChildTraverse('OpenAdditionalInfoButton').style.visibility = "visible"
    mainPanel.FindChildTraverse('HeroInfo').style.visibility = "visible"

    mainPanel.FindChildTraverse('AdditionalInfo').style.visibility = "collapse"
    mainPanel.FindChildTraverse('ReturnHeroInfoButton').style.visibility = "collapse"
    mainPanel.FindChildTraverse('TimerButton1').style.visibility = "collapse"
    mainPanel.FindChildTraverse('TimerButton2').style.visibility = "collapse"
}

function TimerButton1ChangeValue(){
    UpdateTimer = 15
}

function TimerButton2ChangeValue(){
    UpdateTimer = 60
}


function NumberReduction(number){
    count = ["", "k", "M", "B", "T","Qd","Qt","S"];
    i = 0;
    while (number > 1000) {
        number /= 1000;
        i++;
    }
    if(number > 0){
        return(Math.round(number * 100) / 100).toFixed(2)+ count[i];
    }else{
        return 0
    }
    
}

function Think()
{   
    DamageTableUpdate();
    $.Schedule(0.25, Think);
}

(function() {
    Think();
})();