/**
 * Copyright (c) Codice Foundation
 *
 * This is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details. A copy of the GNU Lesser General Public License
 * is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 *
 **/
/*global define, setTimeout*/
const Marionette = require('marionette');
const _ = require('underscore');
const $ = require('jquery');
const template = require('./query-advanced.hbs');
const CustomElements = require('js/CustomElements');
const FilterBuilderView = require('component/filter-builder/filter-builder.view');
const FilterBuilderModel = require('component/filter-builder/filter-builder');
const cql = require('js/cql');
const store = require('js/store');
const QuerySettingsView = require('component/query-settings/query-settings.view');

module.exports = Marionette.LayoutView.extend({
    template: template,
    tagName: CustomElements.register('query-advanced'),
    modelEvents: {
    },
    events: {
        'click .editor-edit': 'edit',
        'click .editor-cancel': 'cancel',
        'click .editor-save': 'save'
    },
    regions: {
        querySettings: '.query-settings',
        queryAdvanced: '.query-advanced'
    },
    ui: {
    },
    initialize: function() {
        this.$el.toggleClass('is-form-builder', this.options.isFormBuilder === true);
        this.$el.toggleClass('is-form', this.options.isForm === true);
    },
    onBeforeShow: function(){
        this.model = this.model._cloneOf ? store.getQueryById(this.model._cloneOf) : this.model;
        this.querySettings.show(new QuerySettingsView({
            model: this.model,
            isForm: this.options.isForm || false,
            isFormBuilder: this.options.isFormBuilder || false
        }));
        this.queryAdvanced.show(new FilterBuilderView({
            model: new FilterBuilderModel(),
            isForm: this.options.isForm || false,
            isFormBuilder: this.options.isFormBuilder || false
        }));

        if (this.options.isForm === true && this.model.get('filterTree') !== undefined) {
            this.queryAdvanced.currentView.deserialize(cql.simplify(JSON.parse(this.model.get('filterTree'))));
        }
        else if (this.model.get('cql')) {
            this.queryAdvanced.currentView.deserialize(cql.simplify(cql.read(this.model.get('cql'))));
        }
        this.queryAdvanced.currentView.turnOffEditing();
        this.edit();
    },
    focus: function(){
        var tabbable =  _.filter(this.$el.find('[tabindex], input, button'), function(element){
            return element.offsetParent !== null;
        });
        if (tabbable.length > 0){
            $(tabbable[0]).focus();
        }
    },
    edit: function(){
        this.$el.addClass('is-editing');
        this.querySettings.currentView.turnOnEditing();
        this.queryAdvanced.currentView.turnOnEditing();
        if (this.options.isForm === true && this.options.isFormBuilder !== true) {
            this.queryAdvanced.currentView.turnOffEditing();
            //TODO: https://codice.atlassian.net/browse/DDF-3861 Deal with the oddities in turning off editing in that view 
            //this.querySettings.currentView.turnOffEditing();
        }
    },
    cancel: function(){
        this.$el.removeClass('is-editing');
        this.onBeforeShow();
    },
    save: function(){
        this.$el.removeClass('is-editing');
        this.querySettings.currentView.saveToModel();

        this.queryAdvanced.currentView.sortCollection();
        this.model.set({
            cql: this.options.isFormBuilder !== true ? this.queryAdvanced.currentView.transformToCql() : "",
            filterTree: JSON.stringify(this.queryAdvanced.currentView.getFilters())
        });
    },
    setDefaultTitle: function() {
        this.model.set('title', this.model.get('cql'));
    },
    serializeTemplateParameters: function() {
        this.queryAdvanced.currentView.sortCollection();
        return {
            filterTree: this.queryAdvanced.currentView.getFilters(),
            filterSettings: this.querySettings.currentView.toJSON()
        }
    }
});
