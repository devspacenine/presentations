module.exports = {
    /*****************************************************************************
    * Titleize Getter
    *-----------------------------------------------------------------------------
    *
    * Returns a string capitalized like a title.
    *
    *****************************************************************************/
    Titleize: function(val) {
        return val.titleize();
    },

    /*****************************************************************************
    * Escape HTML Getter
    *-----------------------------------------------------------------------------
    *
    * Returns a string with HTML tags and elements escaped.
    *
    *****************************************************************************/
    EscapeHTML: function(val) {
        return val.escapeHTML();
    }
}
