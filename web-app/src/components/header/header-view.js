import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import styles from './header-styles';
import { TextField, InputAdornment, Avatar } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { Link } from 'react-router-dom';

const SearchBar = ({ classes, onSubmit, handleChange }) => (
    <form onSubmit={onSubmit}>
        <TextField
            className={classes.searchBar}
            id="searchInput"
            name="search"
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <SearchIcon />
                    </InputAdornment>
                ),
                disableUnderline: true,
                className: classes.searchInput
            }}
            onChange={handleChange}
        />
    </form>
);

const ProfileAvatar = ({ classes, image }) => (
    <Link to="/profile">
        <Avatar className={classes.avatar} src={image || '/assets/no-avatar.png'}>
            User
        </Avatar>
    </Link>
);

class HeaderView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            search: ''
        };

        this.handleChange = this.handleChange.bind(this);
        this.onSearchSubmit = this.onSearchSubmit.bind(this);
    }

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value });
    }

    onSearchSubmit(e) {
        e.preventDefault();
        this.props.onSearch(this.state.search);
        return false;
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.header}>
                <SearchBar classes={classes} handleChange={this.handleChange} onSubmit={this.onSearchSubmit} />
                <ProfileAvatar classes={classes} />
            </div>
        );
    }
}

HeaderView.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(HeaderView);
