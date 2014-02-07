# -*- coding: utf-8 -*-
#
# Copyright (c) 2011-2013, Cédric Krier
# Copyright (c) 2011-2013, B2CK
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#     * Redistributions of source code must retain the above copyright
#       notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above copyright
#       notice, this list of conditions and the following disclaimer in the
#       documentation and/or other materials provided with the distribution.
#     * Neither the name of the <organization> nor the
#       names of its contributors may be used to endorse or promote products
#       derived from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
# ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import unittest
import warnings
from array import array

from sql import Table, Literal
from sql.operators import And, Not, Less, Equal, NotEqual, In, FloorDiv


class TestOperators(unittest.TestCase):
    table = Table('t')

    def test_and(self):
        and_ = And((self.table.c1, self.table.c2))
        self.assertEqual(str(and_), '("c1" AND "c2")')
        self.assertEqual(and_.params, ())

        and_ = And((Literal(True), self.table.c2))
        self.assertEqual(str(and_), '(%s AND "c2")')
        self.assertEqual(and_.params, (True,))

    def test_not(self):
        not_ = Not(self.table.c)
        self.assertEqual(str(not_), '(NOT "c")')
        self.assertEqual(not_.params, ())

        not_ = Not(Literal(False))
        self.assertEqual(str(not_), '(NOT %s)')
        self.assertEqual(not_.params, (False,))

    def test_less(self):
        less = Less(self.table.c1, self.table.c2)
        self.assertEqual(str(less), '("c1" < "c2")')
        self.assertEqual(less.params, ())

        less = Less(Literal(0), self.table.c2)
        self.assertEqual(str(less), '(%s < "c2")')
        self.assertEqual(less.params, (0,))

    def test_equal(self):
        equal = Equal(self.table.c1, self.table.c2)
        self.assertEqual(str(equal), '("c1" = "c2")')
        self.assertEqual(equal.params, ())

        equal = Equal(Literal('foo'), Literal('bar'))
        self.assertEqual(str(equal), '(%s = %s)')
        self.assertEqual(equal.params, ('foo', 'bar'))

        equal = Equal(self.table.c1, None)
        self.assertEqual(str(equal), '("c1" IS NULL)')
        self.assertEqual(equal.params, ())

        equal = Equal(Literal('test'), None)
        self.assertEqual(str(equal), '(%s IS NULL)')
        self.assertEqual(equal.params, ('test',))

        equal = Equal(None, self.table.c1)
        self.assertEqual(str(equal), '("c1" IS NULL)')
        self.assertEqual(equal.params, ())

        equal = Equal(None, Literal('test'))
        self.assertEqual(str(equal), '(%s IS NULL)')
        self.assertEqual(equal.params, ('test',))

    def test_not_equal(self):
        equal = NotEqual(self.table.c1, self.table.c2)
        self.assertEqual(str(equal), '("c1" != "c2")')
        self.assertEqual(equal.params, ())

        equal = NotEqual(self.table.c1, None)
        self.assertEqual(str(equal), '("c1" IS NOT NULL)')
        self.assertEqual(equal.params, ())

        equal = NotEqual(None, self.table.c1)
        self.assertEqual(str(equal), '("c1" IS NOT NULL)')
        self.assertEqual(equal.params, ())

    def test_in(self):
        in_ = In(self.table.c1, [self.table.c2, 1, None])
        self.assertEqual(str(in_), '("c1" IN ("c2", %s, %s))')
        self.assertEqual(in_.params, (1, None))

        t2 = Table('t2')
        in_ = In(self.table.c1, t2.select(t2.c2))
        self.assertEqual(str(in_),
            '("c1" IN (SELECT "a"."c2" FROM "t2" AS "a"))')
        self.assertEqual(in_.params, ())

        in_ = In(self.table.c1, t2.select(t2.c2) | t2.select(t2.c3))
        self.assertEqual(str(in_),
            '("c1" IN (SELECT "a"."c2" FROM "t2" AS "a" '
            'UNION SELECT "a"."c3" FROM "t2" AS "a"))')
        self.assertEqual(in_.params, ())

        in_ = In(self.table.c1, array('l', range(10)))
        self.assertEqual(str(in_),
            '("c1" IN (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s))')
        self.assertEqual(in_.params, tuple(range(10)))

    def test_floordiv(self):
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            FloorDiv(4, 2)
            self.assertEqual(len(w), 1)
            self.assertTrue(issubclass(w[-1].category, DeprecationWarning))
            self.assertIn('FloorDiv operator is deprecated, use Div function',
                str(w[-1].message))
