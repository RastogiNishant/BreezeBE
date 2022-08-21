'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
    FILTER_NAME_CONNECT,
    FILTER_NAME_ESTATE,
    FILTER_NAME_MATCH,
} = require('../constants')
class FilterName extends Base {
    static schema = () =>
        yup.object().shape({
            filterName: yup.string().oneOf([FILTER_NAME_CONNECT, FILTER_NAME_ESTATE, FILTER_NAME_MATCH]).required(),
        })
}

module.exports = FilterName
