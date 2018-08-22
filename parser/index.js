import { fromJS, Map } from 'immutable';

export const P_DATE = 'date';
export const P_PRIORITY = 'priority';
export const P_TAGS = 'tags';

export const P_TYPE = 'type';
export const P_TYPE_NOTE = 'Note';
export const P_TYPE_TODO = 'Todo';
export const P_TYPES = fromJS({
  [P_TYPE_TODO]: '\\[\\]',
  // Event: '',
  // Goal: '',
});

export const PATHS = {
  PARSED: [ 'text', 'parsed' ],
  RAW: [ 'text', 'raw' ],
  PROPS: [ 'props' ],
};

const DEFAULT_ITEM = fromJS({
  text: {
    raw: '',
    parsed: '',
  },
  props: {
    [P_TYPE]: P_TYPE_NOTE,
    [P_PRIORITY]: 0,
  },
});

const filters = fromJS([
  {
    regex: '[Tt]od(?:ay)?', // tod, today, Tod, Today
    removeOriginal: true,
    filter ( filters ) {
      return filters.set( P_DATE, Date.now() );
    },
  },
  {
    regex: '!{1,}', // priority = num of exclams
    removeOriginal: true,
    filter ( filters, matches ) {
      return filters.set( P_PRIORITY, matches[0].length );
    },
  },
  {
    regex: '#[a-zA-Z0-9_-]+', // #tag1, #tag-2, #tag_3
    removeOriginal: false,
    filter ( filters, matches ) {
      return filters.set( P_TAGS, fromJS( matches.map( m => m.replace( '#' , '' ) ) ) );
    },
  },
  // TODO
  // yesterday
  // tomorrow
  // next week
  // this week
  // next wednesday
  // 9/21
])

// add in tyoe indicators, e.g.:
//   [] todo
.concat( P_TYPES.map( ( regex, typ ) => Map({
  removeOriginal: true,
  regex,
  filter ( filters ) {
    return filters.set( P_TYPE, typ );
  },
})).toList() )
;

export const parse = filterString => {
  let filterObject = DEFAULT_ITEM
    .setIn( PATHS.PARSED, filterString )
    .setIn( PATHS.RAW, filterString )
    ;

  return filters.reduce( ( filterObject, filter ) => {
    const matches = [
      new RegExp( `(?:\\s)${filter.get( 'regex' )}(?:\\s)`, 'g' ),
      new RegExp( `(?:\\s)${filter.get( 'regex' )}(?:$)` ),
      new RegExp( `(?:^)${filter.get( 'regex' )}(?:\\s)` ),
    ]
      .reduce( ( m, re ) => m.concat( filterObject.getIn( PATHS.PARSED ).match( re ) ), [] )
      .filter( r => r )
      .map( m => m.trim() )
      ;
    
    if ( ! matches.length ) {
      return filterObject;
    }

    if ( filter.get( 'removeOriginal' ) ) {
      // FIXME(jdm): extra replaces are a hack for no spaces in the pattern
      filterObject = filterObject.updateIn(
        PATHS.PARSED,
        t => t
          .replace( new RegExp( filter.get( 'regex' ) ), '' )
          .replace( /\s{2,}/g, ' ' )
          .trim()
      );
    }

    return filterObject.updateIn(
      PATHS.PROPS,
      f => filter.get( 'filter' )( f, matches )
    );
  }, filterObject );
};

