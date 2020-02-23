//Common.js
var loginctrl = "#loggedUser";
var loaderctrl = "#loader";
var loadCounter = 0;
var loadCounterText = "";
var ChartData = [];
var failCounter = 0;

function login(isinit, ctrl) {
	loginctrl = ctrl;
	login(isinit);
}

function login(isinit) {
//const login = (isinit) => {
    //TODO: Change URL
	$.get("https://jasonrdonald.atlassian.net/rest/auth/1/session", function(data, status) {
			console.log('login: ' + status);

		})
		.done(function(data) {
			$(loginctrl).html('You (' + data.name + ') are logged in!');
			if (isinit) {
				init();
				onload(); //NoSprint
			}
		})
		.fail(function(status) {
			console.log('login fail');
			$(loginctrl).html('You are not Logged in!');
		});
}

function loader(push, ctrl)
//const loader = (push, ctrl) =>
{
	loaderctrl = ctrl;
	login(push);
}

function loader(push) {
	if (push == 1) {
		loadCounter += 1;
		loadCounterText = "Loading (" + loadCounter +") services..";
		$(loaderctrl).html(loadCounterText);

	} else if (push == 100) {
		failCounter += 1;

		if (failCounter == 1) {
			$(loaderctrl).html('One of the services failed');
		} else {
			$(loaderctrl).html('(' + failCounter + ') services failed');
		}
	} else {
		loadCounter -= 1;

		if (loadCounter == 0) {
			failCounter = 0;
			$(loaderctrl).html('Loaded successfully!');
			loadCounterText = "";
		} else {
			loadCounterText = "Still Loading (" + loadCounter +") services..";
			$(loaderctrl).html(loadCounterText);
		}
	}
}

function renderChart(){

    var chart = new CanvasJS.Chart("chartContainer", {
        animationEnabled: true,
        exportEnabled: true,
        title: {
            text: "Burndown Chart"
        },
        axisY: {
            title: "Story Point",
            includeZero: false,
            interval: 10,
            suffix: "",
            valueFormatString: "#"
        },
        data: [{
            type: "stepLine",
            yValueFormatString: "#0.0\"%\"",
            xValueFormatString: "MMM YYYY",
            martkerSize: 5, 
            dataPoints: ChartData
            /*
            [
                {x: new Date(2018, 0, 1), y: 5.0},
                {x: new Date(2018, 0, 2), y: 4.0},
                {x: new Date(2018, 0, 3), y: 3.0},
                {x: new Date(2018, 0, 4), y: 2.0, indexLabel: "Highest", indexLabelFontColor: "#C24642"},
            ]
            */
        }]
    });
    chart.render();
}

function generateDDL(name, div)
{
    if($("#ddl" + name).length == 0)
    {
        $("#" + div).append("<div>" + div + ">" + name + "s:");
        $("#" + div).append("<select id='ddl" + name + " onchange='ddlChange();'> </select>");
        $("#ddl" + name).append("<option value ='0' selected='selected' name='any'> -- Any" + name + "--</option>");
        $("#ddl" + name).append("<option value ='-1' name='none'> --No " + name + "--</option>");
        $("#" + div).append("</div>");
    }
    else{
        $("#ddl" + name).empty();
        $("#ddl" + name).append("<option value ='0' selected='selected' name='any'> -- Any" + name + "--</option>");
        $("#ddl" + name).append("<option value ='-1' name='none'> --No " + name + "--</option>");
    }
}

//TODO: Change URL
var baseurl = "https://jasonrdonald.atlassian.net";
var api = "https://jasonrdonald.atlassian.net/rest/agile/latest/board/";
var api2 = "https://jasonrdonald.atlassian.net/rest/api/latest/project/";
var project = "CONMGMT";
var boardID = "12345";

var type = "epic";
var debug = false;
var jqlUrl = '';
var jqlRestUrl = '';
var jqlQuery = '';

function initCommon()
{
    getProject();
    getResolutions();
    getBoard();
    getUsers();
}

function getProject()
{
    loader(1);
    var query = api2 + project;
    $.get(query, function(data, status){
        loader(0);
        generateDDL("Component", "Project");
        $.each(data.components, function(i, val) {
            logMessage(val.id + " :: " + val.name, "getProject.Components");
            $("#ddlComponent").append("<option value='" + val.id + "' name='" + val.name + "'>" + val.name + "</option>");
        });

        generateDDL("IssueType", "IssueType");
        $.each(data.issueTypes, function(i, val) {
            if(i==0) {getProjectStatuses();}
            logMessage(val.id + " :: " + val.name + " :: subtask(" + val.subtask + ")", "getProject.IssueTypes");
            $("#ddlIssueType").append("<option value='" + val.id + "' name='" + val.name + "'>" + val.name + " :: subtask(" + val.subtask + ")</option>");
        });

        $("#ddlIssueType").change(function(){
            generateDDL("Status", "IssueType");
            if($("#ddlIssueType :selected").length !=0)
            {
                IssueType = $("#ddlIssueType :selected").val();
                $.each(ProjectStatuses, function(i,val){
                    if(val.id == IssueType)
                    {
                        $.each(val.statuses, function(i, val){
                            logMessage(val.id + " :: " + val.name + " :: statusCategory(" + val.statusCategory.name + ")", "getProject.IssueTypes.Statuses");
                            $("#ddlStatus").append("<option value='" + val.id + "' name='" + val.name + "'>" + val.name + " :: statusCategory(" + val.statusCategory.name + ")</option>");
                        });  
                    }
                });
            }
        });

        generateDDL("Version", "Project");
        $.each(data.versions, function(i, val) {
            logMessage(val.id + " :: " + val.name + " :: released(" + val.released + ")", "getProject.IssueTypes");
            $("#ddlVersion").append("<option value='" + val.id + "' name='" + val.name + "'>" + val.name + " :: released(" + val.released + ")</option>");
        });
    })
    .fail(function(data) {
        loader(100);
    });
}

var ProjectStatuses = [];
var IssueType = '';
function getProjectStatuses()
{
    var query = api2 + project + "/statuses";
    $.get(query, function(data, status){
        ProjectStatuses = data;
    })
    .fail(function(data){
        loader(100);
    });
}

function getResolutions()
{
    var query = baseurl + "rest/api/latest/resolution";
    $.get(query, function(data, status){
        generateDDL("Resolution", "IssueType");

        $.each(data, function(i, val) {
            logMessage(val.id + " :: " + val.name + " :: " + val.state + "", "getSprints");
            $("#ddlResolution").append("<option value='" + val.id + "' name='" + val.name + "' title='" + val.description + "'>" + val.name + "</option>");
        });
    });
}

function getBoard()
{
    loader(1);
    $.get(api, {"projectKeyOrId" : project}, 
        function(data, status){
            loader(0);
            generateDDL("Board","Board");

            $.each(data.values, function(i, val){
                logMessage(val.id + " :: " + val.name + " :: " + val.type + "", "getBoard");
                $("#ddlBoard").append("<option value='" + val.id + "' name='" + val.name + "' type='" + val.type + "'>" + val.name + " :: " + val.type + "</option>");   
            });
            
            $("#ddlBoard").change(function(){
                if($("#ddlBoard :selected").length != 0)
                {
                    boardId = $("#ddlBoard").val();
                    boardType = $("ddlBoard :selected").attr("type");

                    if(boardType == "scrum")
                    {
                        getSprints();
                    }
                    else
                    {
                        generateDDL("Sprint", "Board");
                    }
                    getEpics('epic');
                }
            });
        }
    )
    .fail(function(data){
            loader(100);
        });
    
}

function getSprints()
{
    var query = api + boardID + "/" + "sprint";
    $.get(query, function(data, status){
        generateDDL("Sprint", "Board");
        $.each(data.values, function(i, val){
            logMessage(val.id + " :: " + val.name + " :: " + val.state, "getSprints");
            $("#ddlSprint").append("<option value='" + val.id + "' name='" + val.name + "'>" + val.name + " :: " + val.state + "</option>");
        });
    })
    .done(function(){ console.log("done"); })
    .fail(function(data){ loader(100); });
}

function getEpics(issuetype)
{
    //issuetype : epic | issue
    var query = api + boardID + "/" + "issuetype";
    $.get(query, function(data, status){
        generateDDL("Epic", "Board");
        $.each(data.values, function(i, val){
            logMessage(val.id + " :: " + val.name + " :: " + val.summary, "getIssues");
            $("#ddlEpic").append("<option value='" + val.id + "' name='" + val.name + "'>" + val.name + " :: " + val.done + "</option>");
        });

        $("#ddlEpic").change( function(){
            if($("#ddlEpic :selected").length != 0)
            {
                epicid = $("#ddlEpic").val();
                getLabels(epicid);
            }
        });
    })
    .done(function(){ console.log("done"); })
    .fail(function(data){ loader(100); });
    
}

function getUsers()
{
    var query = "userlist.json";
    $.get(query, function(data, status){
        $.each(data, function(i, val){
            logMessage(val.id + " :: " + val.name + " :: " + val.type, "getUsers");
            $("#ddlUser").append("<option value='" + val.id + "' name='" + val.name + "'>" + val.name + " :: " + val.type + "</option>");

        });
    })
    .done(function(){ console.log("done"); })
    .fail(function(data){ loader(100); });
}

function getLabels(epicid)
{
    var query = "labels.json";
    $.get(query, function(data, status){
        generateDDL("Label", "Board");
        $.each(data, function(i, val){

        if(val.epicid !=undefined && epicid == val.epicid)
            {
                logMessage(val.id + " :: " + val.name + " :: " + val.type, "getLabels");
                $("#ddlLabel").append("<option value='" + val.id + "' name='" + val.name + "'>" + val.name + " :: Feature(" + val.isFeature + ")</option>");            
            }
        });
    })
    .done(function(){ console.log("done"); })
    .fail(function(data){ loader(100); });
}

function ddlChange()
{
    projectQ = getDDLValue(project, "Project", true);
    //boardIDQ = "board/" + boardID + "/";
    epicidQ = getDDLValue($('#ddlEpic :selected').attr('name'), "Epic Link");
    sprintidQ = getDDLValue($('#ddlSprint :selected').attr('name'), "Sprint");

    if($('#ddlUser :selected').attr('name')!= 'any')
    {
        userQ = encodeURIComponent("(");
        userQ += getDDLValue($('#ddlUser').val(), "Assignee", true);
        userQ += "%20OR%20";
        userQ += getDDLValue($('ddlUser').val(), "Reporter", true);
        userQ += encodeURIComponent(") AND ");
    }
    else
    {
        userQ = "";
    }

    labelsQ = getDDLValue($('#ddlLabel :selected').attr('name'), "Labels");
    //Replace | delimiter

    componentsQ = getDDLValue($('#ddlComponent :selected').attr('name'), "Component");
    versionQ = getDDLValue($('#ddlVersion :selected').attr('name'), "fixVersion");
    issueTypeQ = getDDLValue($('#ddlVersion :selected').attr('name'), "Type");
    statusQ = getDDLValue($('#ddlStatus :selected').attr('name'), "Status");
    resolutionQ = getDDLValue($('#ddlResolution :selected').attr('name'), "Resolution");
    //statusCategoryQ = getDDLValue($('#ddlStatus').attr('name'), "Status");

    jqlQuery = epicidQ + sprintidQ + userQ + labelsQ + componentsQ + versionQ + issueTypeQ + statusQ + resolutionQ + projectQ;
    jqlUrl = baseurl + "issues/?jql=" + jqlQuery;
    jqlRestUrl = api + boardID + "/issue?jql=" + jqlQuery;

    if(debug = true)
        console.log(jqlQuery);
    
    if($('#txtQuery') != undefined && $('#txtQuery').length > 0)
        $('#txtQuery').val(jqlUrl);

    if($('#aRestQuery') != undefined && $('#aRestQuery').length > 0)
        $('#aRestQuery').attr('href', jqlRestUrl);

}

function getDDLValue(ddlValue, ctrl, isLast)
{
    isLast = isLast || false;
    var returnValue = '';
    if(ddlvalue == 0 || ddlValue == 'any' || ddlValue == undefined || ddlValue == null)
        return '';
    else if(ddlValue == -1 || ddlValue == 'none')
        returnValue = '%22' + ctrl + '%22' + ' is EMPTY';
    else
        returnValue = '%22' + ctrl + '%22' + '%3D' + '%22' + encodeURIComponent(ddlValue) + '%22';

    return isLast ? returnValue : returnValue + "%20and%20";
}
