// 사용 가능한 데이터베이스 로딩
let useDatabaseOptions = [];
let useAllDatabaseOptions = [];
let useDatabaseOptionsCreator = function(){

	// 사용자 접근 가능 Database
	webix.ajax().get("/database/list",{accessAll:false},function(text,data){
		if(data.json().httpStatus ==200 
				&& null!=data.json().contents){	
			var obj = data.json().contents.content;
			// 기본값 입력
			useDatabaseOptions.push({
				id:"",
				value:'database 를 선택 하세요'
			});
			$.each(obj,function(index,db){
				useDatabaseOptions.push({
					id:db.id,
					value:db.hostAlias+' ['+db.account+"@"+db.host+':'+db.port+']'
				});
			});
		} else {
			webix.message({ type:"error", text:data.json().message});
		}
	});

	// 전체 데이터베이스 --> 관리자만 사용 가능함
	webix.ajax().get("/database/list",{accessAll:true},function(text,data){
		if(data.json().httpStatus ==200 
				&& null!=data.json().contents){	
			var obj = data.json().contents.content;
			// 기본값 입력
			useAllDatabaseOptions.push({
				id:"",
				value:'database 를 선택 하세요'
			});
			$.each(obj,function(index,db){
				useAllDatabaseOptions.push({
					id:db.id,
					value:db.hostAlias+' ['+db.account+"@"+db.host+':'+db.port+']'
				});
			});
		} else {
			webix.message({ type:"error", text:data.json().message});
		}
	});
}
useDatabaseOptionsCreator();

// 검색 화면
var search_form_creator = function(){
	// 검색 조건 doc 로딩
	let searchParams = swaggerApiDocs.paths['/srDataRequest/list'].get.parameters;
	let elementList = [];

	// 검색 조건 로딩
	$.each(searchParams,function(index,param){
		// 제외 문자열
		if($.inArray(param.name,excludeParams) == -1) {
			elementList.push(createWebForm(param,false,false));
		}
	});
	
	// 페이지 element 추가
	elementList.push({
		id:"sr_data_request_search_page",
		view:"text", 	
		name:"page",
		value:1,
		type:"hidden",
		height:0,
		width:0,
	});
	
	elementList.push({
		cols:[{
			id:"sr_data_request_search_reset",
			view:"button",
			value:"리셋",
			on:{"onItemClick":function(){
				$$("sr_data_request_search_form").setValues("");
			}}
		}, {
			id:"sr_data_request_search_form_commit",

			view:"button",
			value:"검색",
			on:{"onItemClick":function(){
				// 페이지 초기화
			    $$('sr_data_request_search_page').setValue(0);
			    $$("sr_data_request_list_page").config.page=0;
			    // 리스트 검색
				sr_data_request_list_create();
			}}
		}] // end cols
	});	

	// eleements 추가
	for(let index in elementList){
		$$("sr_data_request_search_form").addView(elementList[index]);
	}
}

/**
 *  리스트
 */
var sr_data_request_list_create = function(){
	// 리스트에서 표시할 데이터를 가져온다.
	if($$("sr_data_request_list_view").config.columns.length==0){
		var fields = swaggerApiDocs.definitions['SR DATA REQUEST MODEL'].properties;

		var loop=0;
		$.each(fields,function(header,obj){
			$$("sr_data_request_list_view").config.columns[loop]={};
			$$("sr_data_request_list_view").config.columns[loop].id = header;
			$$("sr_data_request_list_view").config.columns[loop].header = obj.description;
			$$("sr_data_request_list_view").config.columns[loop].adjust = true;
			loop++;
		});
		$$("sr_data_request_list_view").refreshColumns();
	} // end create header
	
	
	// progress 시작
	try {
		$$("sr_data_request_list_view").showProgress();
	} catch (e) {
		// progress 가 없을 경우 생성 한다음 다시 실행 한다.
		webix.extend($$("sr_data_request_list_view"), webix.ProgressBar);
		$$("sr_data_request_list_view").showProgress();
	}

	// 데이터 로딩
	webix.ajax().get("/srDataRequest/list",  $$("sr_data_request_search_form").getValues(), function(text,data){
		if(data.json().httpStatus == 200 
				&& null!=data.json().contents){

			$$("sr_data_request_list_page").config.size=data.json().contents.size;
			$$("sr_data_request_list_page").config.count=data.json().contents.totalElements;
			$$("sr_data_request_list_page").refresh();
			$$("sr_data_request_list_view").clearAll();
			$$("sr_data_request_list_view").parse(data.json().contents.content);		
			$$("sr_data_request_list_view").refresh();
		} else {
			webix.message({ type:"error", text:data.json().message });	
		}
		// progress 를 닫는다.
		$$("sr_data_request_list_view").hideProgress();
	});
};

// 항목 로딩을 지연시키기 위한 처리
var swaggerlazyLoading = function(){
	if(null==swaggerApiDocs || useDatabaseOptions.length==0){
		setTimeout(() => {swaggerlazyLoading()}, 100);		
	} else {
		// 검색창 호출
		search_form_creator();
		//  리스트 조회 호출
		sr_data_request_list_create();
	}
}

// 항목 로딩
webix.ready(function(){
	// 검색창과,  리스트 지연 호출
	swaggerlazyLoading();
});


/**
 * 등록 팝업
 */
let sr_data_request_popup = function(requestItem){
	webix.ui({
	    view:"window",
	    id:"sr_data_request_popup",
		width:'100%',
		height:'100%',
	    position:"center",
	    modal:true,
	    head:(undefined==requestItem ? "ADD" : "Modify")+" SR Data Request",
	    body:{ cols:[
	    	{
				id:"sr_data_request_form_left",
				view:"form",
				borderless:true,
				elements: []
			},
			{
				id:"sr_data_request_form_right",
				view:"form",
				borderless:true,
				elements: [],
				scroll:"y"
			},
		]},
	}).show();

	// form 생성
	sr_data_request_form_creator(requestItem);
}

/**
 * 팝업 elements 생성
 */
var sr_data_request_form_creator = function(requestItem){
	let path='';							// swagger path
	let formParams=[];						// swagger form parameters
	let elementList = [];					// request from elements
	let dynamicElements = [];				// dynamic form elements

	// buttons
	let buttonCancel = { // 취소
		view:"button", value:"취소", click:function() {
			$$("sr_data_request_popup").hide();
		} ,hotkey: "esc"
	};

	let buttonAddConditions = { // 조건 추가
		view:"button", value:"조건 추가 >> ", click:function() {
			$$("sr_data_request_form_right").addView({
				view:"fieldset",
				label:"SQL Condition Info",
				body:{cols:[
						{
							rows: webix.copy(dynamicElements)
						},
						{
							width:50,
							view:"button",
							value:"삭제", click:function() {
								let removeID = this.getParentView().getParentView().config.id;
								$$("sr_data_request_form_right").removeView(removeID);
							}
						}]
				}
			});
		}
	};

	let buttonResist = { // 등록
		view:"button", value:"등록", click:function(){
			// 왼쪽 뷰의 데이터 정리
			let addLeftParameter = $$("sr_data_request_form_left").getValues();
			addLeftParameter.runSql = window.btoa(encodeURIComponent(addLeftParameter.runSql));

			// 오른쪽 폼은 멀티플 데이터 이다.
			let addRightParameter = $$("sr_data_request_form_right").getValues();
			$.each(addRightParameter,function(name){
				let paramViews = $$("sr_data_request_form_right").queryView({name:name},'all')
				let values = []
				$.each(paramViews,function(index){
					let currentValue = "";
					// sql 은 인코딩 처리 한다.
					if(name=="conditionWhereSql"){
						currentValue = window.btoa(encodeURIComponent(this.getValue()));
					} else {
						currentValue = this.getValue();
					}
					// 원본 값이 undefined 인 경우에는 공백으로 전송 한다.
					values.push(this.getValue() == "undefined" ? "" : currentValue);
				});
				addLeftParameter[name] = values.join(",");
			});

			webix.ajax().post(path, addLeftParameter, function(text,data){
				if(data.json().httpStatus==200){
					webix.message(data.json().message);
					$$("sr_data_request_popup").hide();
					sr_data_request_list_create();
				} else {
					webix.message({ type:"error", text:data.json().message });
				}
			});
		}
	};



	if(undefined==requestItem){ // 신규 등록
		// path 기록
		path='/srDataRequest/add';
		// params 설정
		formParams=swaggerApiDocs.paths[path].post.parameters;
		// elements 객체 생성
		$.each(formParams,function(index,param){
			// 제외 문자열
			if($.inArray(param.name,excludeParams) == -1) {
				// console.log(param);
				// DB 선택을 맨 위로
				if(param.name.toLowerCase().indexOf("databaseid") >=0){
					elementList.unshift(createWebForm(param,true,false));
				}
				// 배열이면서, 컨디션인 경우에만..
				else if(param.type=="array" && param.name.toLowerCase().indexOf("condition") >= 0){
					dynamicElements.push(createWebForm(param,true,false));
				}
				// 그 외
				else {
					elementList.push(createWebForm(param,true,false));
				}
			}
		});
		// 구역 구분
		elementList.unshift({ template:"SR Request INFO", type:"section"});

		// 버튼 추가
		elementList.push({
			cols:[buttonCancel,buttonResist,buttonAddConditions]
		});

		// elements left 추가
		for(let index in elementList){
			$$("sr_data_request_form_left").addView(elementList[index]);
		}

	} else { // 수정
		// 객체 모델
		let pSrRequest=swaggerApiDocs.definitions['SR DATA REQUEST MODEL'].properties;
		let pSrRequestCondition=swaggerApiDocs.definitions['SR Data Request 검색 조건'].properties;

		console.log(pSrRequest);
		console.log(pSrRequestCondition);

		// parameter 형식으로 변경 한다.
		let pDetail = [];

		$.each(pSrRequest, function(name,value){
			pDetail.push({
				name:name,
				description:value.description,
			});
		});
		
		// modify able parameter 설정
		let pModify={};
		// confirm 상태 확인하여 수정범위 지정
		if(requestItem.confirmYN == "Y"){
			path='/srDataRequest/modifyAfterConfirm';
		} else {
			path='/srDataRequest/modifyBeforeConfirm';
		}
		// parameter 설정
		pModify=swaggerApiDocs.paths[path].put.parameters;		
		
		// elements 객체 생성
		$.each(pDetail,function(pIndex,param){
			// 제외 문자열
			if($.inArray(param.name,excludeParams) == -1) {		
				// 수정 대상 필드를 찾는다.
				let modifyParam = null;
				$.each(pModify,function(cIndex,modify){
					let isModifyParam = param.name!='id' && param.name==modify.name;								
					isModifyParam = isModifyParam || (param.name=='sendMemberVos' && modify.name=='srDataAllowMemberIds');
					isModifyParam = isModifyParam || (param.name=='databaseVo' && modify.name=='databaseId'  && requestItem.confirmYN!="Y");
					if(isModifyParam){
						modifyParam = modify;
					}
				});

				if(null!=modifyParam){
					elementList.push(createWebForm(modifyParam,true,false));
				} else {
					elementList.push(createWebForm(param,true,true));
				}
			}
		});
		
		// 즉시 실행 버튼
		let runNow = {
			view:"button", value:"즉시 실행", click:function(){
				webix.ajax().put('/srDataRequest/runNow',{id:requestItem.id,test:"false"}, function(text,data){
					if(data.json().httpStatus==200){
						webix.message(data.json().message);
					} else {
						webix.message({ type:"error", text:data.json().message });
					}
				});
			}
		}
		
		// 테스트 실행 
		let runTest = {
			view:"button", value:"SQL 생성 테스트", click:function(){
				webix.ajax().put('/srDataRequest/runNow',{id:requestItem.id,test:"true"}, function(text,data){
					if(data.json().httpStatus==200){
						webix.message(data.json().message);
					} else {
						webix.message({ type:"error", text:data.json().message });
					}
				});
			}
		}
		
		// 수정 버튼
		let modifyButton ={
			view:"button", value:"수정", click:function(){// 수정
				let modifyAlaramParameter = $$("sr_data_request_form").getValues();
				modifyAlaramParameter.beforeSql = window.btoa(encodeURIComponent(modifyAlaramParameter.beforeSql));
				modifyAlaramParameter.runSql = window.btoa(encodeURIComponent(modifyAlaramParameter.runSql));
				webix.ajax().put(path, modifyAlaramParameter, function(text,data){
					if(data.json().httpStatus==200){
						webix.message(data.json().message);
						$$("sr_data_request_popup").hide();
						sr_data_request_list_create();
					} else {
						webix.message({ type:"error", text:data.json().message });
					}
				});
			}
		} 

		// 승인 요청
		let confirmRequestButton={
			view:"button", value:"승인요청", click:function(){// 승인요청
				webix.ajax().put('/srDataRequest/confirmRequest', {id : requestItem.id}, function(text,data){
					if(data.json().httpStatus==200){
						webix.message(data.json().message);
						$$("sr_data_request_popup").hide();
						sr_data_request_list_create();
					} else {
						webix.message({ type:"error", text:data.json().message });
					}
				});
			}
		}
		
		// 승인 버튼
		let confirmButton={
			view:"button", value:"승인", click:function(){// 승인
				webix.ajax().put('/srDataRequest/confirm', {id : requestItem.id, confirmYN:"Y"}, function(text,data){
					if(data.json().httpStatus==200){
						webix.message(data.json().message);
						$$("sr_data_request_popup").hide();
						sr_data_request_list_create();
					} else {
						webix.message({ type:"error", text:data.json().message });
					}
				});
			}
		}

		// 승인 취소
		let confirmCancelButton={
			view:"button", value:"승인취소", click:function(){
				webix.ajax().put('/srDataRequest/confirm', {id : requestItem.id, confirmYN:"N"}, function(text,data){
					if(data.json().httpStatus==200){
						webix.message(data.json().message);
						$$("sr_data_request_popup").hide();
						sr_data_request_list_create();
					} else {
						webix.message({ type:"error", text:data.json().message });
					}
				});
			}
		}

		// 테스트 실행 및 즉시 실행
		if(requestItem.confirmYN == "Y"){
			elementList.push({cols:[runTest,runNow]});
		} else {
			elementList.push({cols:[runTest,{}]});
		}
		
		if(requestItem.confirmYN != "Y" && member.authType=='ADMIN') { 					// 승인 버튼 노출
			elementList.push({cols:[buttonCancel,modifyButton,confirmButton]});
		} else if(requestItem.confirmYN == "Y" && member.authType=='ADMIN') {			// 승인 취소 버튼
			elementList.push({cols:[buttonCancel,modifyButton,confirmCancelButton]});
		}  else if(requestItem.confirmYN != "Y") {										// 승인 전 승인 요청 버튼
			elementList.push({cols:[buttonCancel,modifyButton,confirmRequestButton]});
		}  else {																		// 승인 후 수정
			elementList.push({cols:[buttonCancel,modifyButton]});
		}

		// eleements 추가
		for(let index in elementList){
			$$("sr_data_request_form_left").addView(elementList[index]);
		}

		// run log 에서 온 경우에는 Id가 다르다. -- UI 상의 문제로 변경 처리 
		let alarmId;
		if(undefined!=requestItem.alarmId){
			alarmId=requestItem.alarmId;
		} else if(undefined!= requestItem.id){
			alarmId=requestItem.id;
		}
		// 대상 데이터를 로딩
		webix.ajax().get('/srDataRequest/one', {id:alarmId}, function(text,data){
			if(data.json().httpStatus==200){
				// 설정 값
				let values = {};
				$.each(data.json().contents,function(key,value){
					if(value!=null){
						if(key.indexOf('MemberVo')>= 0) { // 회원인 경우
							if(key=='sendMemberVos'){ // 전송 대상자 -- 배열로 들어온다.
								var sendMembers=[];
								for(index in value){
									sendMembers.push(value[index].id);
								}
								// 키도 변경 한다.
								values['sendMemberIds']=sendMembers.join(',');
							} else { // 그외
								values[key]='['+ value.loginId +']'+'['+ value.teamName +'] ' + value.name;							
							}
						} else if (key.indexOf('databaseVo')>= 0){ // database
																	// 경우
							values['databaseId']=value.id;
						} else {
							values[key]=value;
						}
					}
				});
				// form 에 값을 넣는다.
				$$("sr_data_request_form").setValues(values);
			} else {
				webix.message({ type:"error", text:data.json().message });
				$$("sr_data_request_popup").hide();
			}
		});
	}
};

// confirm 메일을 통해 진입할 경우
var confirmPopupLazyLoading = function(){
	if(null==member || undefined==member || undefined==member.authType){
		setTimeout(() => {confirmPopupLazyLoading()}, 100);		
	} else {
		sr_data_request_popup({"id":getParam("id"),"confirmYN":null});
	}
}

webix.ready(function(){
	// 승인을 위해 호출한 것으로 간주하고, 승인하도록 처리 해 준다.
	if(getParam("id") > 0){
		confirmPopupLazyLoading();
	}
});