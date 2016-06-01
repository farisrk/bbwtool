var React = require('react');
var Image = React.createClass({
    render: function() {
        return (
            <img src="{this.props.src}" width="35px">
        );        
    }
});

module.exports = ListItem;
