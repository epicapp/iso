import test from 'tape';
import { Map, is, List } from 'immutable';
import {
  parse,
  PATHS,
  P_TYPE_TODO,
  P_TYPE_NOTE,
  P_TYPE,
  P_PRIORITY,
  P_TAGS,
} from './';

test( 'filters::parse', t => {
  let expected, actual;
  const filterString1 = '!! do something important today #project1 #project-2';
  const filterString2 = '[] do something important today #project1';
  const filterString3 = 'do something important today';
  const defaultFilter = 'do something important';

  const parsed1 = parse( filterString1 );
  const parsed2 = parse( filterString2 );
  const parsed3 = parse( filterString3 );
  const parsedDefault = parse( defaultFilter );

  t.ok( Map.isMap( parsed1 ), 'should return a Map' );

  // defaults
  expected = defaultFilter;
  actual = parsedDefault.getIn( PATHS.PARSED );
  t.equal( actual, expected, 'should leave text unaltered by default' );

  expected = 0;
  actual = parsedDefault.getIn([ ...PATHS.PROPS, P_PRIORITY ]);
  t.equal( actual, expected, 'should have priority 0 by default' );

  expected = P_TYPE_NOTE;
  actual = parsedDefault.getIn([ ...PATHS.PROPS, P_TYPE ]);
  t.equal( actual, expected, 'should have note type by default' );

  // TODAY
  expected = 'do something important';
  actual = parsed3.getIn( PATHS.PARSED );
  t.equal( actual, expected, 'should remove today' );

  // !!
  expected = 'do something important #project1 #project-2';
  actual = parsed1.getIn( PATHS.PARSED );
  t.equal( actual, expected, 'should remove the priority exclams' );

  expected = 2;
  actual = parsed1.getIn([ ...PATHS.PROPS, P_PRIORITY ]);
  t.equal( actual, expected, 'should set the priority to the number of exclams' );

  // []
  expected = 'do something important #project1';
  actual = parsed2.getIn( PATHS.PARSED );
  t.equal( actual, expected, 'should remove the todo brackets' );

  expected = P_TYPE_TODO;
  actual = parsed2.getIn([ ...PATHS.PROPS, P_TYPE ]);
  t.equal( actual, expected, 'should set the item type to todo' );

  // tags
  expected = List([ 'project1', 'project-2' ]);
  actual = parsed1.getIn([ ...PATHS.PROPS, P_TAGS ]);
  t.ok( is( actual, expected ), 'should set the tags from the hashtags' );

  t.end();
});

