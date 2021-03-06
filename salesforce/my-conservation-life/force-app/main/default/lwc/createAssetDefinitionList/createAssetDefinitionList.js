import { LightningElement, track, api } from 'lwc';
import { dataTypes } from 'c/controllers';

export default class CreateAssetDefinitionList extends LightningElement {
    @track properties = [];
    @track propertyDataTypes; //names starting with data are reserved :(
    @track requiredPropertyLocation;
    currentPropertyId = 1;
    /**
     * Fires when this component is inserted into the DOM.
     * 
     * Creates the prefilled property location.
     * Calls the db/api for datatypes so its child custom properties can populate their combobox.
     */
    connectedCallback() {
        this.addCustomProperty();

        // TODO: this is hardcoded; May need to be grabbed form DB later on
        const locationProperty = {
            name: 'location',
            data_type: 'location',
            required: false,
            is_private: false
        };

        this.requiredPropertyLocation = JSON.stringify(locationProperty);
        dataTypes.find()
            .then(data => {
                // Must stringify because LWC bindings must use primitives, no support for lists/objects
                this.propertyDataTypes = JSON.stringify(data);
            })
            .catch(e => {
                console.error('createAssetDefinitionList.js');
                console.error(e);
            });
    }

    /**
     * Takes advantage of the template's for:each attribute by appending new createAssetDefinitionProperty per value in list.
     */
    addCustomProperty() {
        this.properties.push(this.currentPropertyId);
        this.currentPropertyId++;
    }

    /**
     * Takes advantage of the template's for:each attribute by removing createAssetDefinitionProperty based on the event detail id.
     * 
     * @param {CustomEvent} e - contains the id to remove from properties in e.detail
     */
    handleRemoveProperty(e) {
        const propertyId = e.detail;
        const idx = this.properties.indexOf(propertyId);
        if (idx > -1) {
            this.properties.splice(idx, 1);
        }
    }

    /**
     * Validates all the custom properties by calling each property's validate method.
     * 
     * @returns {boolean} true if all properties are considered valid
     */
    @api
    validateProperties() {
        const propertyElements = this.template.querySelectorAll('c-create-asset-definition-property');
        const validities = [];
        for (let property of propertyElements) {
            let validity = property.validateAttributes();
            validities.push(validity);
        }

        // Return true if all properties returned true
        return validities
            .every(validity => validity === true);
    }

    /**
     * Gets all the child custom properties' attributes
     * 
     * @returns {object[]} an array of the child property attribute objects
     */
    @api
    getCustomProperties() {
        const propertyElements = this.template.querySelectorAll('c-create-asset-definition-property');
        const properties = [];
        for (let property of propertyElements) {
            if (property.getIsCustomProperty()) {
                const attributes = property.getAttributes();
                if (attributes) properties.push(attributes);
            }
        }

        return properties;
    }
}