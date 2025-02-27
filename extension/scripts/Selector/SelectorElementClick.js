var SelectorElementClick = {

	canReturnMultipleRecords: function () {
		return true;
	},

	canHaveChildSelectors: function () {
		return true;
	},

	canHaveLocalChildSelectors: function () {
		return true;
	},

	canCreateNewJobs: function () {
		return false;
	},
	willReturnElements: function () {
		return true;
	},

	getClickElements: function(parentElement) {
		var clickElements = ElementQuery(this.clickElementSelector, parentElement);
		return clickElements;
	},

	/**
	 * Check whether element is still reachable from html. Useful to check whether the element is removed from DOM.
	 * @param element
	 */
	isElementInHTML: function(element) {
		return $(element).closest("html").length !== 0;
	},

	triggerButtonClick: function(clickElement) {

		var cs = new CssSelector({
			enableSmartTableSelector: false,
			parent: $("body")[0],
			enableResultStripping:false
		});
		var cssSelector = cs.getCssSelector([clickElement]);

		// this function will catch window.open call and place the requested url as the elements data attribute
		var script   = document.createElement("script");
		script.type  = "text/javascript";
		script.text  = "" +
			"(function(){ " +
			"var el = document.querySelectorAll('"+cssSelector+"')[0]; " +
			"el.click(); " +
			"})();";
		document.body.appendChild(script);
	},

	getClickElementUniquenessType: function() {

		if(this.clickElementUniquenessType  === undefined) {
			return 'uniqueText';
		}
		else {
			return this.clickElementUniquenessType;
		}
	},

	_getData: function(parentElement) {

		var delay = parseInt(this.delay) || 0;
		var deferredResponse = $.Deferred();
		var foundElements = new UniqueElementList('uniqueText');
		var clickElements = this.getClickElements(parentElement);
		var doneClickingElements = new UniqueElementList(this.getClickElementUniquenessType());

		// add elements that are available before clicking
		var elements = this.getDataElements(parentElement);
		elements.forEach(foundElements.push.bind(foundElements));

		// discard initial elements
		if(this.discardInitialElements) {
			foundElements = new UniqueElementList('uniqueText');
		}

		// no elements to click at the beginning
		if(clickElements.length === 0) {
			deferredResponse.resolve(foundElements);
			return deferredResponse.promise();
		}

		// initial click and wait
		var currentClickElement = clickElements[0];
		this.triggerButtonClick(currentClickElement);
		var nextElementSelection = (new Date()).getTime()+delay;

		// infinitely scroll down and find all items
		var interval = setInterval(function() {

			// find those click elements that are not in the black list
			var allClickElements = this.getClickElements(parentElement);
			clickElements = [];
			allClickElements.forEach(function(element) {
				if(!doneClickingElements.isAdded(element)) {
					clickElements.push(element);
				}
			});

			var now = (new Date()).getTime();
			// sleep. wait when to extract next elements
			if(now < nextElementSelection) {
				//console.log("wait");
				return;
			}

			// add newly found elements to element foundElements array.
			var elements = this.getDataElements(parentElement);
			var addedAnElement = false;
			elements.forEach(function(element) {
				var added = foundElements.push(element);
				if(added) {
					addedAnElement = true;
				}
			});
			//console.log("added", addedAnElement);

			// no new elements found. Stop clicking this button
			if(!addedAnElement) {
				doneClickingElements.push(currentClickElement);
			}

			// continue clicking and add delay, but if there is nothing
			// more to click the finish
			//console.log("total buttons", clickElements.length)
			if(clickElements.length === 0) {
				clearInterval(interval);
				deferredResponse.resolve(foundElements);
			}
			else {
				//console.log("click");
				currentClickElement = clickElements[0];
				// click on elements only once if the type is clickonce
				if(this.clickType === 'clickOnce') {
					doneClickingElements.push(currentClickElement);
				}
				this.triggerButtonClick(currentClickElement);
				nextElementSelection = now+delay;
			}
		}.bind(this), 50);

		return deferredResponse.promise();
	},

	getDataColumns: function () {
		return [];
	},

	getFeatures: function () {
		return ['multiple', 'delay', 'clickElementSelector', 'clickType', 'discardInitialElements', 'clickElementUniquenessType']
	}
};
