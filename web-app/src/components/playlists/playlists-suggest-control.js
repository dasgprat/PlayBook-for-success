import React from 'react';
import PropTypes from "prop-types";
import PlaylistThumb from './playlist-thumb';
import {Redirect, withRouter} from 'react-router-dom';
import { withStyles } from "@material-ui/core/styles";
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import Grid from '@material-ui/core/Grid';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import green from '@material-ui/core/colors/green';
import classNames from 'classnames';
import {connect} from "react-redux";
import { suggestPlaylists } from "../actions/playlists";
import ListSubheader from '@material-ui/core/ListSubheader';

const styles = theme => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
        //justifyContent: 'space-around',
        // overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        margin: theme.spacing.unit,
    },
    control: {
        padding: theme.spacing.unit * 2,
    },
    create: {
        margin: theme.spacing.unit,
    },
    gridList: {
        //flexWrap: 'nowrap',
        //transform: 'translateZ(0)',
    },
    tile: {
        width: '380px!important',
        height: '100%!important',
        overflow: 'visible!important',
    },    
});

class PlaylistsSuggestController extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: this.props.match.params.username,
            redirectToReferrer: false
        };
        this.updateRedirectState = this.updateRedirectState.bind(this);
    }

    updateRedirectState() {
        this.setState({redirectToReferrer: true});
    }

    componentDidMount() {
        this.props.suggestPlaylists();
    }

    render() {
        const { classes, suggestions } = this.props;
        if (this.state.redirectToReferrer === true) {
            return <Redirect to={`/playlist`}/>;
        }

        return (
            <div className={classes.root}>                
                <Grid container className={classes.root}  spacing={32}>
                    <Grid container className={classes.demo}  spacing={32}>
                        <ListSubheader color="inherit" className={classes.demo} component="div">Explore Playlists We Found For You</ListSubheader>
                    </Grid>
                    <Grid container className={classes.root}  spacing={32}>                                               
                        {suggestions.map(playlist => (                        
                            <Grid key={playlist.id} className={classes.demo}>
                                <PlaylistThumb playlist={playlist}/>
                            </Grid>
                        ))}                
                    </Grid>
                </Grid>
            </div>
        );
    }
}

const mapStateToProps = state => ({
    suggestions: state.suggestions
});

const mapDispatchToProps = dispatch => ({
    suggestPlaylists: () => {
        dispatch(suggestPlaylists())
    }
});

PlaylistsSuggestController.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withRouter(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(PlaylistsSuggestController)));