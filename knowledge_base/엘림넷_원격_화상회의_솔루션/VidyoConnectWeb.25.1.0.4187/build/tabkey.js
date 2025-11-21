(function(window) {
    var elementList = [];
    var tabIndexPos = 0;
    var keyPressTime = new Date().getTime();
    const KEY_DELAY_TIME = 300;
    function loadElement(queryElement) {
        elementList = document.querySelectorAll(queryElement);
        let index = 1;	
        elementList.forEach((item) => {
            item.setAttribute('tabIndex', index);
            index += 1;
        })
    }
    function setFocus(indexPos) {
        tabIndexPos = indexPos;
        if (elementList[tabIndexPos] && elementList[tabIndexPos].focus) {
            elementList[tabIndexPos].focus();
        }
    }
    function clickHandle(event) {
        setTimeout((e) => {            
            if (e.isTrusted === true && (event.target.tabIndex !== -1 || event.target.parentNode.tabIndex !== -1)) {
                tabIndexPos = (event.target.tabIndex !== -1)?event.target.tabIndex-1:event.target.parentNode.tabIndex - 1;
                if (elementList[tabIndexPos] && elementList[tabIndexPos].focus) {
                  elementList[tabIndexPos].focus();  
                }                 
            }
        }, 500, event);
        
    }
    const keyDownHandle = (e) => {
        if (e.code === 'Tab') {
            if (new Date().getTime() - keyPressTime < KEY_DELAY_TIME) {
                return;
            }
            keyPressTime = new Date().getTime();
            if (tabIndexPos  >= elementList.length-1 )
            {
                tabIndexPos = 0;
            } else {
                tabIndexPos +=1
            }                             
            setTimeout(() => {
                if(tabIndexPos === -1)   {
                    tabIndexPos = 0;     
                }					
                if (elementList[tabIndexPos] && elementList[tabIndexPos].focus) {                    
                    elementList[tabIndexPos].focus(); 
                }
            },100);            
        } else if (e.code === 'Enter') {
            e.target.click();
        }			
    }		
    window.addEventListener('keydown', keyDownHandle);
    window.addEventListener('click', clickHandle);
    window.loadElement = loadElement;
    window.setFocus = setFocus;
    window.clickHandle = clickHandle;
})(this);