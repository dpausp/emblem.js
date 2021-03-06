define('emblem', ['exports', 'emblem/parser', 'emblem/compiler', 'emblem/bootstrap'], function (exports, Parser, compiler) {

  'use strict';

  exports['default'] = {
    Parser: Parser['default'],
    registerPartial: compiler.registerPartial,
    parse: compiler.parse,
    compile: compiler.compile,
    VERSION: "0.6.1"
  };

});
define('emblem/ast-builder', ['exports', 'emblem/utils/void-elements'], function (exports, isVoidElement) {

  'use strict';

  exports.generateBuilder = generateBuilder;

  function generateBuilder() {
    reset(builder);
    return builder;
  }function reset(builder) {
    var programNode = {
      type: "program",
      childNodes: []
    };
    builder.currentNode = programNode;
    builder.previousNodes = [];
    builder._ast = programNode;
  }

  var builder = {
    toAST: function () {
      return this._ast;
    },

    generateText: function (content) {
      return { type: "text", content: content };
    },

    text: function (content) {
      var node = this.generateText(content);
      this.currentNode.childNodes.push(node);
      return node;
    },

    generateElement: function (tagName) {
      return {
        type: "element",
        tagName: tagName,
        isVoid: isVoidElement['default'](tagName),
        attrStaches: [],
        classNameBindings: [],
        childNodes: []
      };
    },

    element: function (tagName) {
      var node = this.generateElement(tagName);
      this.currentNode.childNodes.push(node);
      return node;
    },

    generateMustache: function (content, escaped) {
      return {
        type: "mustache",
        escaped: escaped !== false,
        content: content
      };
    },

    generateAssignedMustache: function (content, key) {
      return {
        type: "assignedMustache",
        content: content,
        key: key
      };
    },

    mustache: function (content, escaped) {
      var node = this.generateMustache(content, escaped);
      this.currentNode.childNodes.push(node);
      return node;
    },

    generateBlock: function (content) {
      return {
        type: "block",
        content: content,
        childNodes: [],
        invertibleNodes: []
      };
    },

    block: function (content) {
      var node = this.generateBlock(content);
      this.currentNode.childNodes.push(node);
      return node;
    },

    attribute: function (attrName, attrContent) {
      var node = {
        type: "attribute",
        name: attrName,
        content: attrContent
      };

      this.currentNode.attrStaches.push(node);
      return node;
    },

    generateClassNameBinding: function (classNameBinding) {
      return {
        type: "classNameBinding",
        name: classNameBinding // could be "color", or could be "hasColor:red" or ":color"
      };
    },

    classNameBinding: function (classNameBinding) {
      var node = this.generateClassNameBinding(classNameBinding);
      this.currentNode.classNameBindings.push(node);
      return node;
    },

    enter: function (node) {
      this.previousNodes.push(this.currentNode);
      this.currentNode = node;
    },

    exit: function () {
      var lastNode = this.currentNode;
      this.currentNode = this.previousNodes.pop();
      return lastNode;
    },

    add: function (label, node) {
      if (Array.isArray(node)) {
        for (var i = 0, l = node.length; i < l; i++) {
          this.add(label, node[i]);
        }
      } else {
        this.currentNode[label].push(node);
      }
    }
  };

});
define('emblem/bootstrap', ['emblem/compiler'], function (compiler) {

  'use strict';

  function compileScriptTags(scope) {
    var Handlebars = scope.Handlebars;
    var Ember = scope.Ember;

    if (typeof Ember === "undefined" || Ember === null) {
      throw new Error("Can't run Emblem.enableEmber before Ember has been defined");
    }
    if (typeof document !== "undefined" && document !== null) {
      return Ember.$("script[type=\"text/x-emblem\"], script[type=\"text/x-raw-emblem\"]", Ember.$(document)).each(function () {
        var handlebarsVariant, script, templateName;
        script = Ember.$(this);
        handlebarsVariant = script.attr("type") === "text/x-raw-handlebars" ? Handlebars : Ember.Handlebars;
        templateName = script.attr("data-template-name") || script.attr("id") || "application";
        Ember.TEMPLATES[templateName] = compiler.compile(handlebarsVariant, script.html());
        return script.remove();
      });
    }
  }

  if (typeof window !== "undefined" && window !== null) {
    var ENV = window.ENV || (window.ENV = {});
    ENV.EMBER_LOAD_HOOKS = ENV.EMBER_LOAD_HOOKS || {};
    ENV.EMBER_LOAD_HOOKS.application = ENV.EMBER_LOAD_HOOKS.application || [];
    ENV.EMBER_LOAD_HOOKS.application.push(compileScriptTags);
    ENV.EMBER_LOAD_HOOKS["Ember.Application"] = ENV.EMBER_LOAD_HOOKS["Ember.Application"] || [];
    ENV.EMBER_LOAD_HOOKS["Ember.Application"].push(function (Application) {
      if (Application.initializer) {
        return Application.initializer({
          name: "emblemDomTemplates",
          before: "registerComponentLookup",
          initialize: compileScriptTags
        });
      } else {
        return window.Ember.onLoad("application", compileScriptTags);
      }
    });
  }

});
define('emblem/compiler', ['exports', 'emblem/parser', 'emblem/parser-delegate/ember', 'emblem/preprocessor', 'emblem/template-compiler', 'emblem/ast-builder'], function (exports, parser, EmberDelegate, preprocessor, template_compiler, ast_builder) {

  'use strict';

  exports.compile = compile;

  function compile(emblem) {
    var builder = ast_builder.generateBuilder();
    var processedEmblem = preprocessor.processSync(emblem);
    parser.parse(processedEmblem, { builder: builder });
    var ast = builder.toAST();
    var result = template_compiler.compile(ast);
    return result;
  }

});
define('emblem/mustache-attr-value', ['exports', 'emblem/ast-builder', 'emblem/preprocessor'], function (exports, ast_builder, preprocessor) {

  'use strict';

  /*jshint newcap: false, laxbreak: true */
  var Parser = (function() {
    /*
     * Generated by PEG.js 0.8.0.
     *
     * http://pegjs.majda.cz/
     */

    function peg$subclass(child, parent) {
      function ctor() { this.constructor = child; }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
    }

    function SyntaxError(message, expected, found, offset, line, column) {
      this.message  = message;
      this.expected = expected;
      this.found    = found;
      this.offset   = offset;
      this.line     = line;
      this.column   = column;

      this.name     = "SyntaxError";
    }

    peg$subclass(SyntaxError, Error);

    function parse(input) {
      var options = arguments.length > 1 ? arguments[1] : {},

          peg$FAILED = {},

          peg$startRuleFunctions = { _1start: peg$parse_1start },
          peg$startRuleFunction  = peg$parse_1start,

          peg$c0 = /^[A-Za-z0-9]/,
          peg$c1 = { type: "class", value: "[A-Za-z0-9]", description: "[A-Za-z0-9]" },
          peg$c2 = /^[_\/]/,
          peg$c3 = { type: "class", value: "[_\\/]", description: "[_\\/]" },
          peg$c4 = "-",
          peg$c5 = { type: "literal", value: "-", description: "\"-\"" },
          peg$c6 = ".",
          peg$c7 = { type: "literal", value: ".", description: "\".\"" },
          peg$c8 = peg$FAILED,
          peg$c9 = "[",
          peg$c10 = { type: "literal", value: "[", description: "\"[\"" },
          peg$c11 = [],
          peg$c12 = "]",
          peg$c13 = { type: "literal", value: "]", description: "\"]\"" },
          peg$c14 = void 0,
          peg$c15 = function(v) {
            return v;
          },
          peg$c16 = "as",
          peg$c17 = { type: "literal", value: "as", description: "\"as\"" },
          peg$c18 = "|",
          peg$c19 = { type: "literal", value: "|", description: "\"|\"" },
          peg$c20 = "/",
          peg$c21 = { type: "literal", value: "/", description: "\"/\"" },
          peg$c22 = "\"",
          peg$c23 = { type: "literal", value: "\"", description: "\"\\\"\"" },
          peg$c24 = "'",
          peg$c25 = { type: "literal", value: "'", description: "\"'\"" },
          peg$c26 = null,
          peg$c27 = function(p) {
            return p;
          },
          peg$c28 = /^[^()]/,
          peg$c29 = { type: "class", value: "[^()]", description: "[^()]" },
          peg$c30 = /^[^'"]/,
          peg$c31 = { type: "class", value: "[^'\"]", description: "[^'\"]" },
          peg$c32 = "(",
          peg$c33 = { type: "literal", value: "(", description: "\"(\"" },
          peg$c34 = ")",
          peg$c35 = { type: "literal", value: ")", description: "\")\"" },
          peg$c36 = " ",
          peg$c37 = { type: "literal", value: " ", description: "\" \"" },

          peg$currPos          = 0,
          peg$reportedPos      = 0,
          peg$cachedPos        = 0,
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
          peg$maxFailPos       = 0,
          peg$maxFailExpected  = [],
          peg$silentFails      = 0,

          peg$result;

      if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }

        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }

      function text() {
        return input.substring(peg$reportedPos, peg$currPos);
      }

      function offset() {
        return peg$reportedPos;
      }

      function line() {
        return peg$computePosDetails(peg$reportedPos).line;
      }

      function column() {
        return peg$computePosDetails(peg$reportedPos).column;
      }

      function expected(description) {
        throw peg$buildException(
          null,
          [{ type: "other", description: description }],
          peg$reportedPos
        );
      }

      function error(message) {
        throw peg$buildException(message, null, peg$reportedPos);
      }

      function peg$computePosDetails(pos) {
        function advance(details, startPos, endPos) {
          var p, ch;

          for (p = startPos; p < endPos; p++) {
            ch = input.charAt(p);
            if (ch === "\n") {
              if (!details.seenCR) { details.line++; }
              details.column = 1;
              details.seenCR = false;
            } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
              details.line++;
              details.column = 1;
              details.seenCR = true;
            } else {
              details.column++;
              details.seenCR = false;
            }
          }
        }

        if (peg$cachedPos !== pos) {
          if (peg$cachedPos > pos) {
            peg$cachedPos = 0;
            peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
          }
          advance(peg$cachedPosDetails, peg$cachedPos, pos);
          peg$cachedPos = pos;
        }

        return peg$cachedPosDetails;
      }

      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) { return; }

        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }

        peg$maxFailExpected.push(expected);
      }

      function peg$buildException(message, expected, pos) {
        function cleanupExpected(expected) {
          var i = 1;

          expected.sort(function(a, b) {
            if (a.description < b.description) {
              return -1;
            } else if (a.description > b.description) {
              return 1;
            } else {
              return 0;
            }
          });

          while (i < expected.length) {
            if (expected[i - 1] === expected[i]) {
              expected.splice(i, 1);
            } else {
              i++;
            }
          }
        }

        function buildMessage(expected, found) {
          function stringEscape(s) {
            function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

            return s
              .replace(/\\/g,   '\\\\')
              .replace(/"/g,    '\\"')
              .replace(/\x08/g, '\\b')
              .replace(/\t/g,   '\\t')
              .replace(/\n/g,   '\\n')
              .replace(/\f/g,   '\\f')
              .replace(/\r/g,   '\\r')
              .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
              .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
              .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
              .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
          }

          var expectedDescs = new Array(expected.length),
              expectedDesc, foundDesc, i;

          for (i = 0; i < expected.length; i++) {
            expectedDescs[i] = expected[i].description;
          }

          expectedDesc = expected.length > 1
            ? expectedDescs.slice(0, -1).join(", ")
                + " or "
                + expectedDescs[expected.length - 1]
            : expectedDescs[0];

          foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

          return "Expected " + expectedDesc + " but " + foundDesc + " found.";
        }

        var posDetails = peg$computePosDetails(pos),
            found      = pos < input.length ? input.charAt(pos) : null;

        if (expected !== null) {
          cleanupExpected(expected);
        }

        return new SyntaxError(
          message !== null ? message : buildMessage(expected, found),
          expected,
          found,
          pos,
          posDetails.line,
          posDetails.column
        );
      }

      function peg$parse_0newMustacheNameChar() {
        var s0;

        if (peg$c0.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c1); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c2.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c3); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
              s0 = peg$c4;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c5); }
            }
            if (s0 === peg$FAILED) {
              s0 = peg$parse_0m_arrayIndex();
              if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 46) {
                  s0 = peg$c6;
                  peg$currPos++;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c7); }
                }
              }
            }
          }
        }

        return s0;
      }

      function peg$parse_0m_arrayIndex() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c6;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c7); }
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 91) {
            s2 = peg$c9;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c10); }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_0newMustacheNameChar();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_0newMustacheNameChar();
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 93) {
                s4 = peg$c12;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c13); }
              }
              if (s4 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1start() {
        var s0;

        s0 = peg$parse_1newMustacheAttrValue();

        return s0;
      }

      function peg$parse_1newMustacheAttrValue() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parse_1m_invalidValueStartChar();
        if (s2 === peg$FAILED) {
          s2 = peg$parse_1m_blockStart();
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c14;
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_1m_quotedString();
          if (s2 === peg$FAILED) {
            s2 = peg$parse_1m_valuePath();
            if (s2 === peg$FAILED) {
              s2 = peg$parse_1m_parenthetical();
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_1m_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_1m_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c15(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_blockStart() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c16) {
          s1 = peg$c16;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c17); }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_1m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_1m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 124) {
              s3 = peg$c18;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c19); }
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_invalidValueStartChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 47) {
          s0 = peg$c20;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c21); }
        }

        return s0;
      }

      function peg$parse_1m_quotedString() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c22;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c23); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_1m_stringWithoutDouble();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c22;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c24;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_1m_stringWithoutSingle();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c24;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c25); }
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c8;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
          if (s1 !== peg$FAILED) {
            s1 = input.substring(s0, peg$currPos);
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parse_1m_valuePath() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_0newMustacheNameChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_0newMustacheNameChar();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_parenthetical() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$currPos;
          s4 = peg$parse_1m_OPEN_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parse_1m_inParensChar();
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              s6 = peg$parse_1m_inParensChar();
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_1m_parenthetical();
              if (s6 === peg$FAILED) {
                s6 = peg$c26;
              }
              if (s6 !== peg$FAILED) {
                s7 = [];
                s8 = peg$parse_1m_inParensChar();
                while (s8 !== peg$FAILED) {
                  s7.push(s8);
                  s8 = peg$parse_1m_inParensChar();
                }
                if (s7 !== peg$FAILED) {
                  s8 = peg$parse_1m_CLOSE_PAREN();
                  if (s8 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c8;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_1m_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_1m_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c27(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_inParensChar() {
        var s0;

        if (peg$c28.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }

        return s0;
      }

      function peg$parse_1m_stringWithoutDouble() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c24;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_inStringChar();
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 39) {
              s2 = peg$c24;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c25); }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_stringWithoutSingle() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s2 = peg$c22;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c23); }
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_inStringChar();
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s2 = peg$c22;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_inStringChar() {
        var s0;

        if (peg$c30.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c31); }
        }

        return s0;
      }

      function peg$parse_1m_OPEN_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c32;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }

        return s0;
      }

      function peg$parse_1m_CLOSE_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 41) {
          s0 = peg$c34;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c35); }
        }

        return s0;
      }

      function peg$parse_1m_() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c36;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }

        return s0;
      }

      peg$result = peg$startRuleFunction();

      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail({ type: "end", description: "end of input" });
        }

        throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
      }
    }

    return {
      SyntaxError: SyntaxError,
      parse:       parse
    };
  })();
  var parse = Parser.parse, ParserSyntaxError = Parser.SyntaxError;
  exports['default'] = parse;

  exports.ParserSyntaxError = ParserSyntaxError;
  exports.parse = parse;

});
define('emblem/mustache-attrs', ['exports', 'emblem/ast-builder', 'emblem/preprocessor'], function (exports, ast_builder, preprocessor) {

  'use strict';

  /*jshint newcap: false, laxbreak: true */
  var Parser = (function() {
    /*
     * Generated by PEG.js 0.8.0.
     *
     * http://pegjs.majda.cz/
     */

    function peg$subclass(child, parent) {
      function ctor() { this.constructor = child; }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
    }

    function SyntaxError(message, expected, found, offset, line, column) {
      this.message  = message;
      this.expected = expected;
      this.found    = found;
      this.offset   = offset;
      this.line     = line;
      this.column   = column;

      this.name     = "SyntaxError";
    }

    peg$subclass(SyntaxError, Error);

    function parse(input) {
      var options = arguments.length > 1 ? arguments[1] : {},

          peg$FAILED = {},

          peg$startRuleFunctions = { _2start: peg$parse_2start },
          peg$startRuleFunction  = peg$parse_2start,

          peg$c0 = /^[A-Za-z0-9]/,
          peg$c1 = { type: "class", value: "[A-Za-z0-9]", description: "[A-Za-z0-9]" },
          peg$c2 = /^[_\/]/,
          peg$c3 = { type: "class", value: "[_\\/]", description: "[_\\/]" },
          peg$c4 = "-",
          peg$c5 = { type: "literal", value: "-", description: "\"-\"" },
          peg$c6 = ".",
          peg$c7 = { type: "literal", value: ".", description: "\".\"" },
          peg$c8 = peg$FAILED,
          peg$c9 = "[",
          peg$c10 = { type: "literal", value: "[", description: "\"[\"" },
          peg$c11 = [],
          peg$c12 = "]",
          peg$c13 = { type: "literal", value: "]", description: "\"]\"" },
          peg$c14 = void 0,
          peg$c15 = function(v) {
            return v;
          },
          peg$c16 = "as",
          peg$c17 = { type: "literal", value: "as", description: "\"as\"" },
          peg$c18 = "|",
          peg$c19 = { type: "literal", value: "|", description: "\"|\"" },
          peg$c20 = "/",
          peg$c21 = { type: "literal", value: "/", description: "\"/\"" },
          peg$c22 = "\"",
          peg$c23 = { type: "literal", value: "\"", description: "\"\\\"\"" },
          peg$c24 = "'",
          peg$c25 = { type: "literal", value: "'", description: "\"'\"" },
          peg$c26 = null,
          peg$c27 = function(p) {
            return p;
          },
          peg$c28 = /^[^()]/,
          peg$c29 = { type: "class", value: "[^()]", description: "[^()]" },
          peg$c30 = /^[^'"]/,
          peg$c31 = { type: "class", value: "[^'\"]", description: "[^'\"]" },
          peg$c32 = "(",
          peg$c33 = { type: "literal", value: "(", description: "\"(\"" },
          peg$c34 = ")",
          peg$c35 = { type: "literal", value: ")", description: "\")\"" },
          peg$c36 = " ",
          peg$c37 = { type: "literal", value: " ", description: "\" \"" },
          peg$c38 = function(attr) { return attr;},
          peg$c39 = function(attrs) {
            return attrs;
          },
          peg$c40 = "=",
          peg$c41 = { type: "literal", value: "=", description: "\"=\"" },
          peg$c42 = function(attrName, attrValue) {
            return attrName + '=' + attrValue;
          },
          peg$c43 = { type: "other", description: "_2INDENT" },
          peg$c44 = { type: "any", description: "any character" },
          peg$c45 = function(t) { return preprocessor.INDENT_SYMBOL === t; },
          peg$c46 = function(t) { return ''; },
          peg$c47 = { type: "other", description: "_2DEDENT" },
          peg$c48 = function(t) { return preprocessor.DEDENT_SYMBOL === t; },
          peg$c49 = { type: "other", description: "_2LineEnd" },
          peg$c50 = "\r",
          peg$c51 = { type: "literal", value: "\r", description: "\"\\r\"" },
          peg$c52 = function(t) { return preprocessor.TERM_SYMBOL == t; },
          peg$c53 = "\n",
          peg$c54 = { type: "literal", value: "\n", description: "\"\\n\"" },
          peg$c55 = function(t) { return false; },

          peg$currPos          = 0,
          peg$reportedPos      = 0,
          peg$cachedPos        = 0,
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
          peg$maxFailPos       = 0,
          peg$maxFailExpected  = [],
          peg$silentFails      = 0,

          peg$result;

      if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }

        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }

      function text() {
        return input.substring(peg$reportedPos, peg$currPos);
      }

      function offset() {
        return peg$reportedPos;
      }

      function line() {
        return peg$computePosDetails(peg$reportedPos).line;
      }

      function column() {
        return peg$computePosDetails(peg$reportedPos).column;
      }

      function expected(description) {
        throw peg$buildException(
          null,
          [{ type: "other", description: description }],
          peg$reportedPos
        );
      }

      function error(message) {
        throw peg$buildException(message, null, peg$reportedPos);
      }

      function peg$computePosDetails(pos) {
        function advance(details, startPos, endPos) {
          var p, ch;

          for (p = startPos; p < endPos; p++) {
            ch = input.charAt(p);
            if (ch === "\n") {
              if (!details.seenCR) { details.line++; }
              details.column = 1;
              details.seenCR = false;
            } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
              details.line++;
              details.column = 1;
              details.seenCR = true;
            } else {
              details.column++;
              details.seenCR = false;
            }
          }
        }

        if (peg$cachedPos !== pos) {
          if (peg$cachedPos > pos) {
            peg$cachedPos = 0;
            peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
          }
          advance(peg$cachedPosDetails, peg$cachedPos, pos);
          peg$cachedPos = pos;
        }

        return peg$cachedPosDetails;
      }

      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) { return; }

        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }

        peg$maxFailExpected.push(expected);
      }

      function peg$buildException(message, expected, pos) {
        function cleanupExpected(expected) {
          var i = 1;

          expected.sort(function(a, b) {
            if (a.description < b.description) {
              return -1;
            } else if (a.description > b.description) {
              return 1;
            } else {
              return 0;
            }
          });

          while (i < expected.length) {
            if (expected[i - 1] === expected[i]) {
              expected.splice(i, 1);
            } else {
              i++;
            }
          }
        }

        function buildMessage(expected, found) {
          function stringEscape(s) {
            function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

            return s
              .replace(/\\/g,   '\\\\')
              .replace(/"/g,    '\\"')
              .replace(/\x08/g, '\\b')
              .replace(/\t/g,   '\\t')
              .replace(/\n/g,   '\\n')
              .replace(/\f/g,   '\\f')
              .replace(/\r/g,   '\\r')
              .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
              .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
              .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
              .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
          }

          var expectedDescs = new Array(expected.length),
              expectedDesc, foundDesc, i;

          for (i = 0; i < expected.length; i++) {
            expectedDescs[i] = expected[i].description;
          }

          expectedDesc = expected.length > 1
            ? expectedDescs.slice(0, -1).join(", ")
                + " or "
                + expectedDescs[expected.length - 1]
            : expectedDescs[0];

          foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

          return "Expected " + expectedDesc + " but " + foundDesc + " found.";
        }

        var posDetails = peg$computePosDetails(pos),
            found      = pos < input.length ? input.charAt(pos) : null;

        if (expected !== null) {
          cleanupExpected(expected);
        }

        return new SyntaxError(
          message !== null ? message : buildMessage(expected, found),
          expected,
          found,
          pos,
          posDetails.line,
          posDetails.column
        );
      }

      function peg$parse_0newMustacheNameChar() {
        var s0;

        if (peg$c0.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c1); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c2.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c3); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
              s0 = peg$c4;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c5); }
            }
            if (s0 === peg$FAILED) {
              s0 = peg$parse_0m_arrayIndex();
              if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 46) {
                  s0 = peg$c6;
                  peg$currPos++;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c7); }
                }
              }
            }
          }
        }

        return s0;
      }

      function peg$parse_0m_arrayIndex() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c6;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c7); }
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 91) {
            s2 = peg$c9;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c10); }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_0newMustacheNameChar();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_0newMustacheNameChar();
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 93) {
                s4 = peg$c12;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c13); }
              }
              if (s4 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1newMustacheAttrValue() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parse_1m_invalidValueStartChar();
        if (s2 === peg$FAILED) {
          s2 = peg$parse_1m_blockStart();
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c14;
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_1m_quotedString();
          if (s2 === peg$FAILED) {
            s2 = peg$parse_1m_valuePath();
            if (s2 === peg$FAILED) {
              s2 = peg$parse_1m_parenthetical();
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_1m_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_1m_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c15(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_blockStart() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c16) {
          s1 = peg$c16;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c17); }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_1m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_1m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 124) {
              s3 = peg$c18;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c19); }
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_invalidValueStartChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 47) {
          s0 = peg$c20;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c21); }
        }

        return s0;
      }

      function peg$parse_1m_quotedString() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c22;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c23); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_1m_stringWithoutDouble();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c22;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c24;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_1m_stringWithoutSingle();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c24;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c25); }
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c8;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
          if (s1 !== peg$FAILED) {
            s1 = input.substring(s0, peg$currPos);
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parse_1m_valuePath() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_0newMustacheNameChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_0newMustacheNameChar();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_parenthetical() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$currPos;
          s4 = peg$parse_1m_OPEN_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parse_1m_inParensChar();
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              s6 = peg$parse_1m_inParensChar();
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_1m_parenthetical();
              if (s6 === peg$FAILED) {
                s6 = peg$c26;
              }
              if (s6 !== peg$FAILED) {
                s7 = [];
                s8 = peg$parse_1m_inParensChar();
                while (s8 !== peg$FAILED) {
                  s7.push(s8);
                  s8 = peg$parse_1m_inParensChar();
                }
                if (s7 !== peg$FAILED) {
                  s8 = peg$parse_1m_CLOSE_PAREN();
                  if (s8 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c8;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_1m_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_1m_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c27(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_inParensChar() {
        var s0;

        if (peg$c28.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }

        return s0;
      }

      function peg$parse_1m_stringWithoutDouble() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c24;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_inStringChar();
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 39) {
              s2 = peg$c24;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c25); }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_stringWithoutSingle() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s2 = peg$c22;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c23); }
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_inStringChar();
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s2 = peg$c22;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_inStringChar() {
        var s0;

        if (peg$c30.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c31); }
        }

        return s0;
      }

      function peg$parse_1m_OPEN_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c32;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }

        return s0;
      }

      function peg$parse_1m_CLOSE_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 41) {
          s0 = peg$c34;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c35); }
        }

        return s0;
      }

      function peg$parse_1m_() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c36;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }

        return s0;
      }

      function peg$parse_2start() {
        var s0;

        s0 = peg$parse_2mustacheAttrs();

        return s0;
      }

      function peg$parse_2mustacheAttrs() {
        var s0, s1;

        s0 = peg$parse_2m_bracketedAttrs();
        if (s0 === peg$FAILED) {
          s0 = [];
          s1 = peg$parse_2newMustacheAttr();
          while (s1 !== peg$FAILED) {
            s0.push(s1);
            s1 = peg$parse_2newMustacheAttr();
          }
        }

        return s0;
      }

      function peg$parse_2m_bracketedAttrs() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        s1 = peg$parse_2m_openBracket();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = [];
          s5 = peg$parse_2m_();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parse_2m_();
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_2newMustacheAttr();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_2m_TERM();
              if (s6 === peg$FAILED) {
                s6 = peg$c26;
              }
              if (s6 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c38(s5);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = [];
            s5 = peg$parse_2m_();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parse_2m_();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_2newMustacheAttr();
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_2m_TERM();
                if (s6 === peg$FAILED) {
                  s6 = peg$c26;
                }
                if (s6 !== peg$FAILED) {
                  peg$reportedPos = s3;
                  s4 = peg$c38(s5);
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            peg$silentFails++;
            s4 = peg$parse_2m_closeBracket();
            peg$silentFails--;
            if (s4 !== peg$FAILED) {
              peg$currPos = s3;
              s3 = peg$c14;
            } else {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c39(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2newMustacheAttr() {
        var s0;

        s0 = peg$parse_2m_keyValue();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_2m_parenthetical();
          if (s0 === peg$FAILED) {
            s0 = peg$parse_1newMustacheAttrValue();
          }
        }

        return s0;
      }

      function peg$parse_2m_keyValue() {
        var s0, s1, s2, s3, s4, s5, s6, s7;

        s0 = peg$currPos;
        s1 = peg$parse_2newMustacheAttrName();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_2m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_2m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 61) {
              s3 = peg$c40;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c41); }
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parse_2m_();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parse_2m_();
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_1newMustacheAttrValue();
                if (s5 !== peg$FAILED) {
                  s6 = [];
                  s7 = peg$parse_2m_();
                  while (s7 !== peg$FAILED) {
                    s6.push(s7);
                    s7 = peg$parse_2m_();
                  }
                  if (s6 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c42(s1, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2newMustacheAttrName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_2newMustacheNameChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_2newMustacheNameChar();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_2m_parenthetical() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_2m_();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_2m_();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$currPos;
          s4 = peg$parse_2m_OPEN_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parse_2m_inParensChar();
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              s6 = peg$parse_2m_inParensChar();
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_2m_parenthetical();
              if (s6 === peg$FAILED) {
                s6 = peg$c26;
              }
              if (s6 !== peg$FAILED) {
                s7 = [];
                s8 = peg$parse_2m_inParensChar();
                while (s8 !== peg$FAILED) {
                  s7.push(s8);
                  s8 = peg$parse_2m_inParensChar();
                }
                if (s7 !== peg$FAILED) {
                  s8 = peg$parse_2m_CLOSE_PAREN();
                  if (s8 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c8;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_2m_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_2m_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c27(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2m_inParensChar() {
        var s0;

        if (peg$c28.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }

        return s0;
      }

      function peg$parse_2m_OPEN_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c32;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }

        return s0;
      }

      function peg$parse_2m_CLOSE_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 41) {
          s0 = peg$c34;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c35); }
        }

        return s0;
      }

      function peg$parse_2m_() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c36;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }

        return s0;
      }

      function peg$parse_2m_openBracket() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 91) {
          s1 = peg$c9;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c10); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_2m_TERM();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_2m_INDENT();
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2m_closeBracket() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parse_2m_DEDENT();
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_2m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_2m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s3 = peg$c12;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c13); }
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2m_INDENT() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.length > peg$currPos) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c45(s1);
          if (s2) {
            s2 = peg$c14;
          } else {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c46(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c43); }
        }

        return s0;
      }

      function peg$parse_2m_DEDENT() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.length > peg$currPos) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c48(s1);
          if (s2) {
            s2 = peg$c14;
          } else {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c46(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c47); }
        }

        return s0;
      }

      function peg$parse_2m_TERM() {
        var s0, s1, s2, s3, s4;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 13) {
          s1 = peg$c50;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c51); }
        }
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c44); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = peg$currPos;
            s3 = peg$c52(s2);
            if (s3) {
              s3 = peg$c14;
            } else {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 10) {
                s4 = peg$c53;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c54); }
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c55(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c49); }
        }

        return s0;
      }

      function peg$parse_2newMustacheNameChar() {
        var s0;

        if (peg$c0.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c1); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c2.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c3); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
              s0 = peg$c4;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c5); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 46) {
                s0 = peg$c6;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c7); }
              }
            }
          }
        }

        return s0;
      }

      peg$result = peg$startRuleFunction();

      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail({ type: "end", description: "end of input" });
        }

        throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
      }
    }

    return {
      SyntaxError: SyntaxError,
      parse:       parse
    };
  })();
  var parse = Parser.parse, ParserSyntaxError = Parser.SyntaxError;
  exports['default'] = parse;

  exports.ParserSyntaxError = ParserSyntaxError;
  exports.parse = parse;

});
define('emblem/mustache-name-character', ['exports', 'emblem/ast-builder', 'emblem/preprocessor'], function (exports, ast_builder, preprocessor) {

  'use strict';

  /*jshint newcap: false, laxbreak: true */
  var Parser = (function() {
    /*
     * Generated by PEG.js 0.8.0.
     *
     * http://pegjs.majda.cz/
     */

    function peg$subclass(child, parent) {
      function ctor() { this.constructor = child; }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
    }

    function SyntaxError(message, expected, found, offset, line, column) {
      this.message  = message;
      this.expected = expected;
      this.found    = found;
      this.offset   = offset;
      this.line     = line;
      this.column   = column;

      this.name     = "SyntaxError";
    }

    peg$subclass(SyntaxError, Error);

    function parse(input) {
      var options = arguments.length > 1 ? arguments[1] : {},

          peg$FAILED = {},

          peg$startRuleFunctions = { _0start: peg$parse_0start },
          peg$startRuleFunction  = peg$parse_0start,

          peg$c0 = /^[A-Za-z0-9]/,
          peg$c1 = { type: "class", value: "[A-Za-z0-9]", description: "[A-Za-z0-9]" },
          peg$c2 = /^[_\/]/,
          peg$c3 = { type: "class", value: "[_\\/]", description: "[_\\/]" },
          peg$c4 = "-",
          peg$c5 = { type: "literal", value: "-", description: "\"-\"" },
          peg$c6 = ".",
          peg$c7 = { type: "literal", value: ".", description: "\".\"" },
          peg$c8 = peg$FAILED,
          peg$c9 = "[",
          peg$c10 = { type: "literal", value: "[", description: "\"[\"" },
          peg$c11 = [],
          peg$c12 = "]",
          peg$c13 = { type: "literal", value: "]", description: "\"]\"" },

          peg$currPos          = 0,
          peg$reportedPos      = 0,
          peg$cachedPos        = 0,
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
          peg$maxFailPos       = 0,
          peg$maxFailExpected  = [],
          peg$silentFails      = 0,

          peg$result;

      if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }

        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }

      function text() {
        return input.substring(peg$reportedPos, peg$currPos);
      }

      function offset() {
        return peg$reportedPos;
      }

      function line() {
        return peg$computePosDetails(peg$reportedPos).line;
      }

      function column() {
        return peg$computePosDetails(peg$reportedPos).column;
      }

      function expected(description) {
        throw peg$buildException(
          null,
          [{ type: "other", description: description }],
          peg$reportedPos
        );
      }

      function error(message) {
        throw peg$buildException(message, null, peg$reportedPos);
      }

      function peg$computePosDetails(pos) {
        function advance(details, startPos, endPos) {
          var p, ch;

          for (p = startPos; p < endPos; p++) {
            ch = input.charAt(p);
            if (ch === "\n") {
              if (!details.seenCR) { details.line++; }
              details.column = 1;
              details.seenCR = false;
            } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
              details.line++;
              details.column = 1;
              details.seenCR = true;
            } else {
              details.column++;
              details.seenCR = false;
            }
          }
        }

        if (peg$cachedPos !== pos) {
          if (peg$cachedPos > pos) {
            peg$cachedPos = 0;
            peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
          }
          advance(peg$cachedPosDetails, peg$cachedPos, pos);
          peg$cachedPos = pos;
        }

        return peg$cachedPosDetails;
      }

      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) { return; }

        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }

        peg$maxFailExpected.push(expected);
      }

      function peg$buildException(message, expected, pos) {
        function cleanupExpected(expected) {
          var i = 1;

          expected.sort(function(a, b) {
            if (a.description < b.description) {
              return -1;
            } else if (a.description > b.description) {
              return 1;
            } else {
              return 0;
            }
          });

          while (i < expected.length) {
            if (expected[i - 1] === expected[i]) {
              expected.splice(i, 1);
            } else {
              i++;
            }
          }
        }

        function buildMessage(expected, found) {
          function stringEscape(s) {
            function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

            return s
              .replace(/\\/g,   '\\\\')
              .replace(/"/g,    '\\"')
              .replace(/\x08/g, '\\b')
              .replace(/\t/g,   '\\t')
              .replace(/\n/g,   '\\n')
              .replace(/\f/g,   '\\f')
              .replace(/\r/g,   '\\r')
              .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
              .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
              .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
              .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
          }

          var expectedDescs = new Array(expected.length),
              expectedDesc, foundDesc, i;

          for (i = 0; i < expected.length; i++) {
            expectedDescs[i] = expected[i].description;
          }

          expectedDesc = expected.length > 1
            ? expectedDescs.slice(0, -1).join(", ")
                + " or "
                + expectedDescs[expected.length - 1]
            : expectedDescs[0];

          foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

          return "Expected " + expectedDesc + " but " + foundDesc + " found.";
        }

        var posDetails = peg$computePosDetails(pos),
            found      = pos < input.length ? input.charAt(pos) : null;

        if (expected !== null) {
          cleanupExpected(expected);
        }

        return new SyntaxError(
          message !== null ? message : buildMessage(expected, found),
          expected,
          found,
          pos,
          posDetails.line,
          posDetails.column
        );
      }

      function peg$parse_0start() {
        var s0;

        s0 = peg$parse_0newMustacheNameChar();

        return s0;
      }

      function peg$parse_0newMustacheNameChar() {
        var s0;

        if (peg$c0.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c1); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c2.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c3); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
              s0 = peg$c4;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c5); }
            }
            if (s0 === peg$FAILED) {
              s0 = peg$parse_0m_arrayIndex();
              if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 46) {
                  s0 = peg$c6;
                  peg$currPos++;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c7); }
                }
              }
            }
          }
        }

        return s0;
      }

      function peg$parse_0m_arrayIndex() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c6;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c7); }
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 91) {
            s2 = peg$c9;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c10); }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_0newMustacheNameChar();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_0newMustacheNameChar();
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 93) {
                s4 = peg$c12;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c13); }
              }
              if (s4 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      peg$result = peg$startRuleFunction();

      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail({ type: "end", description: "end of input" });
        }

        throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
      }
    }

    return {
      SyntaxError: SyntaxError,
      parse:       parse
    };
  })();
  var parse = Parser.parse, ParserSyntaxError = Parser.SyntaxError;
  exports['default'] = parse;

  exports.ParserSyntaxError = ParserSyntaxError;
  exports.parse = parse;

});
define('emblem/mustache-parser', ['exports', 'emblem/ast-builder', 'emblem/preprocessor'], function (exports, ast_builder, preprocessor) {

  'use strict';

  /*jshint newcap: false, laxbreak: true */
  var Parser = (function() {
    /*
     * Generated by PEG.js 0.8.0.
     *
     * http://pegjs.majda.cz/
     */

    function peg$subclass(child, parent) {
      function ctor() { this.constructor = child; }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
    }

    function SyntaxError(message, expected, found, offset, line, column) {
      this.message  = message;
      this.expected = expected;
      this.found    = found;
      this.offset   = offset;
      this.line     = line;
      this.column   = column;

      this.name     = "SyntaxError";
    }

    peg$subclass(SyntaxError, Error);

    function parse(input) {
      var options = arguments.length > 1 ? arguments[1] : {},

          peg$FAILED = {},

          peg$startRuleFunctions = { _3start: peg$parse_3start },
          peg$startRuleFunction  = peg$parse_3start,

          peg$c0 = /^[A-Za-z0-9]/,
          peg$c1 = { type: "class", value: "[A-Za-z0-9]", description: "[A-Za-z0-9]" },
          peg$c2 = /^[_\/]/,
          peg$c3 = { type: "class", value: "[_\\/]", description: "[_\\/]" },
          peg$c4 = "-",
          peg$c5 = { type: "literal", value: "-", description: "\"-\"" },
          peg$c6 = ".",
          peg$c7 = { type: "literal", value: ".", description: "\".\"" },
          peg$c8 = peg$FAILED,
          peg$c9 = "[",
          peg$c10 = { type: "literal", value: "[", description: "\"[\"" },
          peg$c11 = [],
          peg$c12 = "]",
          peg$c13 = { type: "literal", value: "]", description: "\"]\"" },
          peg$c14 = void 0,
          peg$c15 = function(v) {
            return v;
          },
          peg$c16 = "as",
          peg$c17 = { type: "literal", value: "as", description: "\"as\"" },
          peg$c18 = "|",
          peg$c19 = { type: "literal", value: "|", description: "\"|\"" },
          peg$c20 = "/",
          peg$c21 = { type: "literal", value: "/", description: "\"/\"" },
          peg$c22 = "\"",
          peg$c23 = { type: "literal", value: "\"", description: "\"\\\"\"" },
          peg$c24 = "'",
          peg$c25 = { type: "literal", value: "'", description: "\"'\"" },
          peg$c26 = null,
          peg$c27 = function(p) {
            return p;
          },
          peg$c28 = /^[^()]/,
          peg$c29 = { type: "class", value: "[^()]", description: "[^()]" },
          peg$c30 = /^[^'"]/,
          peg$c31 = { type: "class", value: "[^'\"]", description: "[^'\"]" },
          peg$c32 = "(",
          peg$c33 = { type: "literal", value: "(", description: "\"(\"" },
          peg$c34 = ")",
          peg$c35 = { type: "literal", value: ")", description: "\")\"" },
          peg$c36 = " ",
          peg$c37 = { type: "literal", value: " ", description: "\" \"" },
          peg$c38 = function(attr) { return attr;},
          peg$c39 = function(attrs) {
            return attrs;
          },
          peg$c40 = "=",
          peg$c41 = { type: "literal", value: "=", description: "\"=\"" },
          peg$c42 = function(attrName, attrValue) {
            return attrName + '=' + attrValue;
          },
          peg$c43 = { type: "other", description: "_2INDENT" },
          peg$c44 = { type: "any", description: "any character" },
          peg$c45 = function(t) { return preprocessor.INDENT_SYMBOL === t; },
          peg$c46 = function(t) { return ''; },
          peg$c47 = { type: "other", description: "_2DEDENT" },
          peg$c48 = function(t) { return preprocessor.DEDENT_SYMBOL === t; },
          peg$c49 = { type: "other", description: "_2LineEnd" },
          peg$c50 = "\r",
          peg$c51 = { type: "literal", value: "\r", description: "\"\\r\"" },
          peg$c52 = function(t) { return preprocessor.TERM_SYMBOL == t; },
          peg$c53 = "\n",
          peg$c54 = { type: "literal", value: "\n", description: "\"\\n\"" },
          peg$c55 = function(t) { return false; },
          peg$c56 = function(name, attrs, blockParams) {
            attrs = attrs.concat(name.shorthands);
            var ret = {
              name: name.name,
              attrs: attrs,
              blockParams: blockParams
            };
            if (name.modifier) {
              ret.modifier = name.modifier;
            }

            return ret;
          },
          peg$c57 = function(name, shorthands) {
            return {
              name: name.name,
              modifier: name.modifier,
              shorthands: shorthands
            };
          },
          peg$c58 = function(params) {
            return params;
          },
          peg$c59 = "%",
          peg$c60 = { type: "literal", value: "%", description: "\"%\"" },
          peg$c61 = function(tagName) {
            return 'tagName="' + tagName + '"';
          },
          peg$c62 = "#",
          peg$c63 = { type: "literal", value: "#", description: "\"#\"" },
          peg$c64 = function(idName) {
            return 'elementId="' + idName + '"';
          },
          peg$c65 = function(className) {
            return 'class="' + className + '"';
          },
          peg$c66 = /^[A-Za-z0-9\-]/,
          peg$c67 = { type: "class", value: "[A-Za-z0-9\\-]", description: "[A-Za-z0-9\\-]" },
          peg$c68 = function(name, modifier) {
            return {
              name: name,
              modifier: modifier
            };
          },
          peg$c69 = /^[0-9]/,
          peg$c70 = { type: "class", value: "[0-9]", description: "[0-9]" },
          peg$c71 = "!",
          peg$c72 = { type: "literal", value: "!", description: "\"!\"" },
          peg$c73 = "?",
          peg$c74 = { type: "literal", value: "?", description: "\"?\"" },

          peg$currPos          = 0,
          peg$reportedPos      = 0,
          peg$cachedPos        = 0,
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
          peg$maxFailPos       = 0,
          peg$maxFailExpected  = [],
          peg$silentFails      = 0,

          peg$result;

      if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }

        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }

      function text() {
        return input.substring(peg$reportedPos, peg$currPos);
      }

      function offset() {
        return peg$reportedPos;
      }

      function line() {
        return peg$computePosDetails(peg$reportedPos).line;
      }

      function column() {
        return peg$computePosDetails(peg$reportedPos).column;
      }

      function expected(description) {
        throw peg$buildException(
          null,
          [{ type: "other", description: description }],
          peg$reportedPos
        );
      }

      function error(message) {
        throw peg$buildException(message, null, peg$reportedPos);
      }

      function peg$computePosDetails(pos) {
        function advance(details, startPos, endPos) {
          var p, ch;

          for (p = startPos; p < endPos; p++) {
            ch = input.charAt(p);
            if (ch === "\n") {
              if (!details.seenCR) { details.line++; }
              details.column = 1;
              details.seenCR = false;
            } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
              details.line++;
              details.column = 1;
              details.seenCR = true;
            } else {
              details.column++;
              details.seenCR = false;
            }
          }
        }

        if (peg$cachedPos !== pos) {
          if (peg$cachedPos > pos) {
            peg$cachedPos = 0;
            peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
          }
          advance(peg$cachedPosDetails, peg$cachedPos, pos);
          peg$cachedPos = pos;
        }

        return peg$cachedPosDetails;
      }

      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) { return; }

        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }

        peg$maxFailExpected.push(expected);
      }

      function peg$buildException(message, expected, pos) {
        function cleanupExpected(expected) {
          var i = 1;

          expected.sort(function(a, b) {
            if (a.description < b.description) {
              return -1;
            } else if (a.description > b.description) {
              return 1;
            } else {
              return 0;
            }
          });

          while (i < expected.length) {
            if (expected[i - 1] === expected[i]) {
              expected.splice(i, 1);
            } else {
              i++;
            }
          }
        }

        function buildMessage(expected, found) {
          function stringEscape(s) {
            function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

            return s
              .replace(/\\/g,   '\\\\')
              .replace(/"/g,    '\\"')
              .replace(/\x08/g, '\\b')
              .replace(/\t/g,   '\\t')
              .replace(/\n/g,   '\\n')
              .replace(/\f/g,   '\\f')
              .replace(/\r/g,   '\\r')
              .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
              .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
              .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
              .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
          }

          var expectedDescs = new Array(expected.length),
              expectedDesc, foundDesc, i;

          for (i = 0; i < expected.length; i++) {
            expectedDescs[i] = expected[i].description;
          }

          expectedDesc = expected.length > 1
            ? expectedDescs.slice(0, -1).join(", ")
                + " or "
                + expectedDescs[expected.length - 1]
            : expectedDescs[0];

          foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

          return "Expected " + expectedDesc + " but " + foundDesc + " found.";
        }

        var posDetails = peg$computePosDetails(pos),
            found      = pos < input.length ? input.charAt(pos) : null;

        if (expected !== null) {
          cleanupExpected(expected);
        }

        return new SyntaxError(
          message !== null ? message : buildMessage(expected, found),
          expected,
          found,
          pos,
          posDetails.line,
          posDetails.column
        );
      }

      function peg$parse_0newMustacheNameChar() {
        var s0;

        if (peg$c0.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c1); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c2.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c3); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
              s0 = peg$c4;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c5); }
            }
            if (s0 === peg$FAILED) {
              s0 = peg$parse_0m_arrayIndex();
              if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 46) {
                  s0 = peg$c6;
                  peg$currPos++;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c7); }
                }
              }
            }
          }
        }

        return s0;
      }

      function peg$parse_0m_arrayIndex() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c6;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c7); }
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 91) {
            s2 = peg$c9;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c10); }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_0newMustacheNameChar();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_0newMustacheNameChar();
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 93) {
                s4 = peg$c12;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c13); }
              }
              if (s4 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1newMustacheAttrValue() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parse_1m_invalidValueStartChar();
        if (s2 === peg$FAILED) {
          s2 = peg$parse_1m_blockStart();
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c14;
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_1m_quotedString();
          if (s2 === peg$FAILED) {
            s2 = peg$parse_1m_valuePath();
            if (s2 === peg$FAILED) {
              s2 = peg$parse_1m_parenthetical();
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_1m_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_1m_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c15(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_blockStart() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c16) {
          s1 = peg$c16;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c17); }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_1m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_1m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 124) {
              s3 = peg$c18;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c19); }
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_invalidValueStartChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 47) {
          s0 = peg$c20;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c21); }
        }

        return s0;
      }

      function peg$parse_1m_quotedString() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c22;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c23); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_1m_stringWithoutDouble();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c22;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c24;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_1m_stringWithoutSingle();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c24;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c25); }
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c8;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
          if (s1 !== peg$FAILED) {
            s1 = input.substring(s0, peg$currPos);
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parse_1m_valuePath() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_0newMustacheNameChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_0newMustacheNameChar();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_parenthetical() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$currPos;
          s4 = peg$parse_1m_OPEN_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parse_1m_inParensChar();
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              s6 = peg$parse_1m_inParensChar();
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_1m_parenthetical();
              if (s6 === peg$FAILED) {
                s6 = peg$c26;
              }
              if (s6 !== peg$FAILED) {
                s7 = [];
                s8 = peg$parse_1m_inParensChar();
                while (s8 !== peg$FAILED) {
                  s7.push(s8);
                  s8 = peg$parse_1m_inParensChar();
                }
                if (s7 !== peg$FAILED) {
                  s8 = peg$parse_1m_CLOSE_PAREN();
                  if (s8 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c8;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_1m_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_1m_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c27(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_inParensChar() {
        var s0;

        if (peg$c28.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }

        return s0;
      }

      function peg$parse_1m_stringWithoutDouble() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c24;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_inStringChar();
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 39) {
              s2 = peg$c24;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c25); }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_stringWithoutSingle() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s2 = peg$c22;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c23); }
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_inStringChar();
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s2 = peg$c22;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_inStringChar() {
        var s0;

        if (peg$c30.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c31); }
        }

        return s0;
      }

      function peg$parse_1m_OPEN_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c32;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }

        return s0;
      }

      function peg$parse_1m_CLOSE_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 41) {
          s0 = peg$c34;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c35); }
        }

        return s0;
      }

      function peg$parse_1m_() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c36;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }

        return s0;
      }

      function peg$parse_2mustacheAttrs() {
        var s0, s1;

        s0 = peg$parse_2m_bracketedAttrs();
        if (s0 === peg$FAILED) {
          s0 = [];
          s1 = peg$parse_2newMustacheAttr();
          while (s1 !== peg$FAILED) {
            s0.push(s1);
            s1 = peg$parse_2newMustacheAttr();
          }
        }

        return s0;
      }

      function peg$parse_2m_bracketedAttrs() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        s1 = peg$parse_2m_openBracket();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = [];
          s5 = peg$parse_2m_();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parse_2m_();
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_2newMustacheAttr();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_2m_TERM();
              if (s6 === peg$FAILED) {
                s6 = peg$c26;
              }
              if (s6 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c38(s5);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = [];
            s5 = peg$parse_2m_();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parse_2m_();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_2newMustacheAttr();
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_2m_TERM();
                if (s6 === peg$FAILED) {
                  s6 = peg$c26;
                }
                if (s6 !== peg$FAILED) {
                  peg$reportedPos = s3;
                  s4 = peg$c38(s5);
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            peg$silentFails++;
            s4 = peg$parse_2m_closeBracket();
            peg$silentFails--;
            if (s4 !== peg$FAILED) {
              peg$currPos = s3;
              s3 = peg$c14;
            } else {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c39(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2newMustacheAttr() {
        var s0;

        s0 = peg$parse_2m_keyValue();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_2m_parenthetical();
          if (s0 === peg$FAILED) {
            s0 = peg$parse_1newMustacheAttrValue();
          }
        }

        return s0;
      }

      function peg$parse_2m_keyValue() {
        var s0, s1, s2, s3, s4, s5, s6, s7;

        s0 = peg$currPos;
        s1 = peg$parse_2newMustacheAttrName();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_2m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_2m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 61) {
              s3 = peg$c40;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c41); }
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parse_2m_();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parse_2m_();
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_1newMustacheAttrValue();
                if (s5 !== peg$FAILED) {
                  s6 = [];
                  s7 = peg$parse_2m_();
                  while (s7 !== peg$FAILED) {
                    s6.push(s7);
                    s7 = peg$parse_2m_();
                  }
                  if (s6 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c42(s1, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2newMustacheAttrName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_2newMustacheNameChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_2newMustacheNameChar();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_2m_parenthetical() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_2m_();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_2m_();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$currPos;
          s4 = peg$parse_2m_OPEN_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parse_2m_inParensChar();
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              s6 = peg$parse_2m_inParensChar();
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_2m_parenthetical();
              if (s6 === peg$FAILED) {
                s6 = peg$c26;
              }
              if (s6 !== peg$FAILED) {
                s7 = [];
                s8 = peg$parse_2m_inParensChar();
                while (s8 !== peg$FAILED) {
                  s7.push(s8);
                  s8 = peg$parse_2m_inParensChar();
                }
                if (s7 !== peg$FAILED) {
                  s8 = peg$parse_2m_CLOSE_PAREN();
                  if (s8 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c8;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_2m_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_2m_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c27(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2m_inParensChar() {
        var s0;

        if (peg$c28.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }

        return s0;
      }

      function peg$parse_2m_OPEN_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c32;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }

        return s0;
      }

      function peg$parse_2m_CLOSE_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 41) {
          s0 = peg$c34;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c35); }
        }

        return s0;
      }

      function peg$parse_2m_() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c36;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }

        return s0;
      }

      function peg$parse_2m_openBracket() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 91) {
          s1 = peg$c9;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c10); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_2m_TERM();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_2m_INDENT();
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2m_closeBracket() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parse_2m_DEDENT();
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_2m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_2m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s3 = peg$c12;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c13); }
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2m_INDENT() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.length > peg$currPos) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c45(s1);
          if (s2) {
            s2 = peg$c14;
          } else {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c46(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c43); }
        }

        return s0;
      }

      function peg$parse_2m_DEDENT() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.length > peg$currPos) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c48(s1);
          if (s2) {
            s2 = peg$c14;
          } else {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c46(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c47); }
        }

        return s0;
      }

      function peg$parse_2m_TERM() {
        var s0, s1, s2, s3, s4;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 13) {
          s1 = peg$c50;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c51); }
        }
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c44); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = peg$currPos;
            s3 = peg$c52(s2);
            if (s3) {
              s3 = peg$c14;
            } else {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 10) {
                s4 = peg$c53;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c54); }
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c55(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c49); }
        }

        return s0;
      }

      function peg$parse_2newMustacheNameChar() {
        var s0;

        if (peg$c0.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c1); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c2.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c3); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
              s0 = peg$c4;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c5); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 46) {
                s0 = peg$c6;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c7); }
              }
            }
          }
        }

        return s0;
      }

      function peg$parse_3start() {
        var s0;

        s0 = peg$parse_3newMustache();

        return s0;
      }

      function peg$parse_3newMustache() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parse_3newMustacheStart();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_3m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_3m_();
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_2mustacheAttrs();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_3m_blockParams();
              if (s4 === peg$FAILED) {
                s4 = peg$c26;
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c56(s1, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3newMustacheStart() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parse_3newMustacheName();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_3m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_3m_();
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_3newMustacheShortHand();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_3newMustacheShortHand();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c57(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3m_blockParams() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parse_3m_blockStart();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_3m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_3m_();
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_1newMustacheAttrValue();
            if (s4 !== peg$FAILED) {
              while (s4 !== peg$FAILED) {
                s3.push(s4);
                s4 = peg$parse_1newMustacheAttrValue();
              }
            } else {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 124) {
                s4 = peg$c18;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c19); }
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c58(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3m_blockStart() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c16) {
          s1 = peg$c16;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c17); }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_3m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_3m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 124) {
              s3 = peg$c18;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c19); }
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3newMustacheShortHand() {
        var s0;

        s0 = peg$parse_3m_shortHandTagName();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_3m_shortHandIdName();
          if (s0 === peg$FAILED) {
            s0 = peg$parse_3m_shortHandClassName();
          }
        }

        return s0;
      }

      function peg$parse_3m_shortHandTagName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 37) {
          s1 = peg$c59;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c60); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_3newMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c61(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3m_shortHandIdName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 35) {
          s1 = peg$c62;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c63); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_3newMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c64(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3m_shortHandClassName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c6;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c7); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_3newMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c65(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3newMustacheShortHandName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        if (peg$c66.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c67); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (peg$c66.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c67); }
            }
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_3newMustacheName() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parse_3m_invalidNameStartChar();
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c14;
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          s4 = peg$parse_0newMustacheNameChar();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_0newMustacheNameChar();
            }
          } else {
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_3m_modifierChar();
            if (s3 === peg$FAILED) {
              s3 = peg$c26;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c68(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3m_invalidNameStartChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 46) {
          s0 = peg$c6;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c7); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 45) {
            s0 = peg$c4;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c5); }
          }
          if (s0 === peg$FAILED) {
            if (peg$c69.test(input.charAt(peg$currPos))) {
              s0 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c70); }
            }
          }
        }

        return s0;
      }

      function peg$parse_3m_modifierChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 33) {
          s0 = peg$c71;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c72); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 63) {
            s0 = peg$c73;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c74); }
          }
        }

        return s0;
      }

      function peg$parse_3m_() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c36;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }

        return s0;
      }

      peg$result = peg$startRuleFunction();

      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail({ type: "end", description: "end of input" });
        }

        throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
      }
    }

    return {
      SyntaxError: SyntaxError,
      parse:       parse
    };
  })();
  var parse = Parser.parse, ParserSyntaxError = Parser.SyntaxError;
  exports['default'] = parse;

  exports.ParserSyntaxError = ParserSyntaxError;
  exports.parse = parse;

});
define('emblem/parser-delegate/base', ['exports'], function (exports) {

  'use strict';

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var ParserDelegate = (function () {
    function ParserDelegate(AST, parse) {
      _classCallCheck(this, ParserDelegate);

      _get(Object.getPrototypeOf(ParserDelegate.prototype), "constructor", this).call(this, AST, parse);
    }

    _prototypeProperties(ParserDelegate, null, {
      capitalizedLineStarterMustache: {
        value: function capitalizedLineStarterMustache(node) {
          if (node.mustache) {
            node.mustache = this.handleCapitalizedMustache(node.mustache);
            return node;
          } else {
            return this.handleCapitalizedMustache(node);
          }
        },
        writable: true,
        configurable: true
      },
      handleCapitalizedMustache: {
        value: function handleCapitalizedMustache(mustache) {
          return mustache;
        },
        writable: true,
        configurable: true
      },
      rawMustacheAttribute: {
        value: function rawMustacheAttribute(key, id) {
          var mustacheNode = this.createMustacheNode([id], null, true);

          mustacheNode = this.handleUnboundSuffix(mustacheNode, id);

          return [new this.AST.ContentNode(key + "=" + "\""), mustacheNode, new this.AST.ContentNode("\"")];
        },
        writable: true,
        configurable: true
      },
      handleUnboundSuffix: {
        value: function handleUnboundSuffix(mustacheNode, id) {
          return mustacheNode;
        },
        writable: true,
        configurable: true
      },
      unshiftParam: {

        // Returns a new MustacheNode with a new preceding param (id).
        value: function unshiftParam(mustacheNode, helperName, newHashPairs) {
          var hash = mustacheNode.hash;

          // Merge hash.
          if (newHashPairs) {
            hash = hash || new this.AST.HashNode([]);

            for (var i = 0; i < newHashPairs.length; ++i) {
              hash.pairs.push(newHashPairs[i]);
            }
          }

          var params = [mustacheNode.id].concat(mustacheNode.params);
          params.unshift(new this.AST.IdNode([{ part: helperName }]));
          return this.createMustacheNode(params, hash, mustacheNode.escaped);
        },
        writable: true,
        configurable: true
      },
      createMustacheNode: {
        value: function createMustacheNode(params, hash, escaped) {
          var open = escaped ? "{{" : "{{{";
          return new this.AST.MustacheNode(params, hash, open, { left: false, right: false });
        },
        writable: true,
        configurable: true
      },
      createProgramNode: {
        value: function createProgramNode(statements, inverse) {
          return new this.AST.ProgramNode(statements, { left: false, right: false }, inverse, null);
        },
        writable: true,
        configurable: true
      }
    });

    return ParserDelegate;
  })();

  exports['default'] = ParserDelegate;

});
define('emblem/parser-delegate/ember', ['exports', 'emblem/parser-delegate/base'], function (exports, base) {

  'use strict';

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  /* jshint proto: true */

  var EmberParserDelegate = (function (ParserDelegate) {
    function EmberParserDelegate(AST, parse) {
      _classCallCheck(this, EmberParserDelegate);

      this.AST = AST;
      this.recursiveParse = parse;
    }

    _inherits(EmberParserDelegate, ParserDelegate);

    _prototypeProperties(EmberParserDelegate, null, {
      handleCapitalizedMustache: {
        value: function handleCapitalizedMustache(mustache) {
          return this.unshiftParam(mustache, "view");
        },
        writable: true,
        configurable: true
      },
      handleUnboundSuffix: {
        value: function handleUnboundSuffix(mustacheNode, id) {
          if (id._emblemSuffixModifier === "!") {
            return this.unshiftParam(mustacheNode, "unbound");
          } else {
            return mustacheNode;
          }
        },
        writable: true,
        configurable: true
      }
    });

    return EmberParserDelegate;
  })(base['default']);

  exports['default'] = EmberParserDelegate;

});
define('emblem/parser', ['exports', 'emblem/ast-builder', 'emblem/preprocessor'], function (exports, ast_builder, preprocessor) {

  'use strict';

  /*jshint newcap: false, laxbreak: true */
  var Parser = (function() {
    /*
     * Generated by PEG.js 0.8.0.
     *
     * http://pegjs.majda.cz/
     */

    function peg$subclass(child, parent) {
      function ctor() { this.constructor = child; }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
    }

    function SyntaxError(message, expected, found, offset, line, column) {
      this.message  = message;
      this.expected = expected;
      this.found    = found;
      this.offset   = offset;
      this.line     = line;
      this.column   = column;

      this.name     = "SyntaxError";
    }

    peg$subclass(SyntaxError, Error);

    function parse(input) {
      var options = arguments.length > 1 ? arguments[1] : {},

          peg$FAILED = {},

          peg$startRuleFunctions = { _4start: peg$parse_4start },
          peg$startRuleFunction  = peg$parse_4start,

          peg$c0 = /^[A-Za-z0-9]/,
          peg$c1 = { type: "class", value: "[A-Za-z0-9]", description: "[A-Za-z0-9]" },
          peg$c2 = /^[_\/]/,
          peg$c3 = { type: "class", value: "[_\\/]", description: "[_\\/]" },
          peg$c4 = "-",
          peg$c5 = { type: "literal", value: "-", description: "\"-\"" },
          peg$c6 = ".",
          peg$c7 = { type: "literal", value: ".", description: "\".\"" },
          peg$c8 = peg$FAILED,
          peg$c9 = "[",
          peg$c10 = { type: "literal", value: "[", description: "\"[\"" },
          peg$c11 = [],
          peg$c12 = "]",
          peg$c13 = { type: "literal", value: "]", description: "\"]\"" },
          peg$c14 = void 0,
          peg$c15 = function(v) {
            return v;
          },
          peg$c16 = "as",
          peg$c17 = { type: "literal", value: "as", description: "\"as\"" },
          peg$c18 = "|",
          peg$c19 = { type: "literal", value: "|", description: "\"|\"" },
          peg$c20 = "/",
          peg$c21 = { type: "literal", value: "/", description: "\"/\"" },
          peg$c22 = "\"",
          peg$c23 = { type: "literal", value: "\"", description: "\"\\\"\"" },
          peg$c24 = "'",
          peg$c25 = { type: "literal", value: "'", description: "\"'\"" },
          peg$c26 = null,
          peg$c27 = function(p) {
            return p;
          },
          peg$c28 = /^[^()]/,
          peg$c29 = { type: "class", value: "[^()]", description: "[^()]" },
          peg$c30 = /^[^'"]/,
          peg$c31 = { type: "class", value: "[^'\"]", description: "[^'\"]" },
          peg$c32 = "(",
          peg$c33 = { type: "literal", value: "(", description: "\"(\"" },
          peg$c34 = ")",
          peg$c35 = { type: "literal", value: ")", description: "\")\"" },
          peg$c36 = " ",
          peg$c37 = { type: "literal", value: " ", description: "\" \"" },
          peg$c38 = function(attr) { return attr;},
          peg$c39 = function(attrs) {
            return attrs;
          },
          peg$c40 = "=",
          peg$c41 = { type: "literal", value: "=", description: "\"=\"" },
          peg$c42 = function(attrName, attrValue) {
            return attrName + '=' + attrValue;
          },
          peg$c43 = { type: "other", description: "_2INDENT" },
          peg$c44 = { type: "any", description: "any character" },
          peg$c45 = function(t) { return preprocessor.INDENT_SYMBOL === t; },
          peg$c46 = function(t) { return ''; },
          peg$c47 = { type: "other", description: "_2DEDENT" },
          peg$c48 = function(t) { return preprocessor.DEDENT_SYMBOL === t; },
          peg$c49 = { type: "other", description: "_2LineEnd" },
          peg$c50 = "\r",
          peg$c51 = { type: "literal", value: "\r", description: "\"\\r\"" },
          peg$c52 = function(t) { return preprocessor.TERM_SYMBOL == t; },
          peg$c53 = "\n",
          peg$c54 = { type: "literal", value: "\n", description: "\"\\n\"" },
          peg$c55 = function(t) { return false; },
          peg$c56 = function(name, attrs, blockParams) {
            attrs = attrs.concat(name.shorthands);
            var ret = {
              name: name.name,
              attrs: attrs,
              blockParams: blockParams
            };
            if (name.modifier) {
              ret.modifier = name.modifier;
            }

            return ret;
          },
          peg$c57 = function(name, shorthands) {
            return {
              name: name.name,
              modifier: name.modifier,
              shorthands: shorthands
            };
          },
          peg$c58 = function(params) {
            return params;
          },
          peg$c59 = "%",
          peg$c60 = { type: "literal", value: "%", description: "\"%\"" },
          peg$c61 = function(tagName) {
            return 'tagName="' + tagName + '"';
          },
          peg$c62 = "#",
          peg$c63 = { type: "literal", value: "#", description: "\"#\"" },
          peg$c64 = function(idName) {
            return 'elementId="' + idName + '"';
          },
          peg$c65 = function(className) {
            return 'class="' + className + '"';
          },
          peg$c66 = /^[A-Za-z0-9\-]/,
          peg$c67 = { type: "class", value: "[A-Za-z0-9\\-]", description: "[A-Za-z0-9\\-]" },
          peg$c68 = function(name, modifier) {
            return {
              name: name,
              modifier: modifier
            };
          },
          peg$c69 = /^[0-9]/,
          peg$c70 = { type: "class", value: "[0-9]", description: "[0-9]" },
          peg$c71 = "!",
          peg$c72 = { type: "literal", value: "!", description: "\"!\"" },
          peg$c73 = "?",
          peg$c74 = { type: "literal", value: "?", description: "\"?\"" },
          peg$c75 = function(c) {
            builder.add('childNodes', c);
          },
          peg$c76 = function(statements) {
            return statements;
          },
          peg$c77 = { type: "other", description: "_4BeginStatement" },
          peg$c78 = { type: "other", description: "_4ContentStatement" },
          peg$c79 = function() { return []; },
          peg$c80 = ">",
          peg$c81 = { type: "literal", value: ">", description: "\">\"" },
          peg$c82 = function(n, params) {
            return [new AST.PartialNode(n, params[0], undefined, {})];
          },
          peg$c83 = /^[a-zA-Z0-9_$-\/]/,
          peg$c84 = { type: "class", value: "[a-zA-Z0-9_$-\\/]", description: "[a-zA-Z0-9_$-\\/]" },
          peg$c85 = function(s) {
              return new AST.PartialNameNode(new AST.StringNode(s));
            },
          peg$c86 = function(mustacheTuple) {
            var mustacheOrBlock = createBlockOrMustache(mustacheTuple);

            return [mustacheOrBlock];
          },
          peg$c87 = function(mustacheTuple) {
            return mustacheTuple;
          },
          peg$c88 = function(e, mustacheTuple) {
            var mustache = mustacheTuple[0];
            var block = mustacheTuple[1];
            mustache.isEscaped = e;

            return [mustache, block];
          },
          peg$c89 = /^[A-Z]/,
          peg$c90 = { type: "class", value: "[A-Z]", description: "[A-Z]" },
          peg$c91 = function(mustacheTuple) {
            var mustache = mustacheTuple[0];
            var block = mustacheTuple[1];
            mustache.isViewHelper = true;

            return [mustache, block];
          },
          peg$c92 = function(ret, multilineContent) {
            if(multilineContent) {
              multilineContent = multilineContent[1];
              for(var i = 0, len = multilineContent.length; i < len; ++i) {
                ret.push(' ');
                ret = ret.concat(multilineContent[i]);
              }
            }
            return ret;
          },
          peg$c93 = function(c) { return c; },
          peg$c94 = function(mustacheTuple) {
              var blockOrMustache = createBlockOrMustache(mustacheTuple);
              return [blockOrMustache];
            },
          peg$c95 = function(h) { return h;},
          peg$c96 = function(h, nested) {
            if (nested && nested.length > 0) {
              nested = castStringsToTextNodes(nested);
              builder.add('childNodes', nested);
            }

            return [builder.exit()];
          },
          peg$c97 = function(mustacheContent, blockTuple) {
            if (blockTuple) {
              return [mustacheContent, blockTuple];
            } else {
              return [mustacheContent];
            }
          },
          peg$c98 = ": ",
          peg$c99 = { type: "literal", value: ": ", description: "\": \"" },
          peg$c100 = function(statements) { return statements; },
          peg$c101 = function(statements) {
              return statements;
            },
          peg$c102 = function(i) { return i },
          peg$c103 = function(block) {
              return block;
            },
          peg$c104 = function() { return; },
          peg$c105 = function(c, i) {
            return [c, i];
          },
          peg$c106 = function(b, a, c, i) {
            return { content: c, name: [b, a].join(' '), invertibleNodes: i };
          },
          peg$c107 = "else",
          peg$c108 = { type: "literal", value: "else", description: "\"else\"" },
          peg$c109 = "if",
          peg$c110 = { type: "literal", value: "if", description: "\"if\"" },
          peg$c111 = function(e) { return e.join(''); },
          peg$c112 = function(p) { return p; },
          peg$c113 = function(isPartial, mustache) {
            if(isPartial) {
              var n = new AST.PartialNameNode(new AST.StringNode(sexpr.id.string));
              return new AST.PartialNode(n, sexpr.params[0], undefined, {});
            }

            return mustache;
          },
          peg$c114 = function(t) { return ['tagName', t]; },
          peg$c115 = function(i) { return ['elementId', i]; },
          peg$c116 = function(c) { return ['class', c]; },
          peg$c117 = function(a) {
            return a;
          },
          peg$c118 = function(a) { return a; },
          peg$c119 = { type: "other", description: "_4PathIdent" },
          peg$c120 = "..",
          peg$c121 = { type: "literal", value: "..", description: "\"..\"" },
          peg$c122 = /^[a-zA-Z0-9_$\-!?\^@]/,
          peg$c123 = { type: "class", value: "[a-zA-Z0-9_$\\-!?\\^@]", description: "[a-zA-Z0-9_$\\-!?\\^@]" },
          peg$c124 = function(s) { return s; },
          peg$c125 = /^[^\]]/,
          peg$c126 = { type: "class", value: "[^\\]]", description: "[^\\]]" },
          peg$c127 = function(segmentLiteral) { return segmentLiteral; },
          peg$c128 = { type: "other", description: "_4Key" },
          peg$c129 = ":",
          peg$c130 = { type: "literal", value: ":", description: "\":\"" },
          peg$c131 = function(s, p) { return { part: p, separator: s }; },
          peg$c132 = function(first, tail) {
            var ret = [{ part: first }];
            for(var i = 0; i < tail.length; ++i) {
              ret.push(tail[i]);
            }
            return ret;
          },
          peg$c133 = { type: "other", description: "_4PathSeparator" },
          peg$c134 = /^[\/.]/,
          peg$c135 = { type: "class", value: "[\\/.]", description: "[\\/.]" },
          peg$c136 = function(v) {
            var last = v[v.length - 1];
            var idNode;

            // Support for data keywords that are prefixed with @ in the each
            // block helper such as @index, @key, @first, @last
            if (last.part.charAt(0) === '@') {
              last.part = last.part.slice(1);
              idNode = new AST.IdNode(v);
              var dataNode = new AST.DataNode(idNode);
              return dataNode;
            }

            var match;
            var suffixModifier;

            // FIXME probably need to handle this better?
            if (match = last.part.match(/!$/)) {
              last.part = 'unbound ' + last.part.slice(0, -1);
            }
            if(match = last.part.match(/[\?\^]$/)) {
              suffixModifier = match[0];
              throw "unhandled path terminated: " + suffixModifier;
            }

            return last.part;
          },
          peg$c137 = function(v) { return new AST.StringNode(v); },
          peg$c138 = function(v) { return new AST.NumberNode(v); },
          peg$c139 = function(v) { return new AST.BooleanNode(v); },
          peg$c140 = { type: "other", description: "_4Boolean" },
          peg$c141 = "true",
          peg$c142 = { type: "literal", value: "true", description: "\"true\"" },
          peg$c143 = "false",
          peg$c144 = { type: "literal", value: "false", description: "\"false\"" },
          peg$c145 = { type: "other", description: "_4Integer" },
          peg$c146 = function(s) { return parseInt(s); },
          peg$c147 = function(p) { return p[1]; },
          peg$c148 = /^[^"}]/,
          peg$c149 = { type: "class", value: "[^\"}]", description: "[^\"}]" },
          peg$c150 = /^[^'}]/,
          peg$c151 = { type: "class", value: "[^'}]", description: "[^'}]" },
          peg$c152 = /^[A-Za-z]/,
          peg$c153 = { type: "class", value: "[A-Za-z]", description: "[A-Za-z]" },
          peg$c154 = function(nodes) {
            return nodes;
          },
          peg$c155 = /^[|`']/,
          peg$c156 = { type: "class", value: "[|`']", description: "[|`']" },
          peg$c157 = "<",
          peg$c158 = { type: "literal", value: "<", description: "\"<\"" },
          peg$c159 = function() { return '<'; },
          peg$c160 = function(w) { return w;},
          peg$c161 = function(s, nodes, indentedNodes) {
            var i, l;

            var hasNodes = nodes && nodes.length,
                hasIndentedNodes = indentedNodes && indentedNodes.length;

            // add a space after the first line if it had content and
            // there are indented nodes to follow
            if (hasNodes && hasIndentedNodes) { nodes.push(' '); }

            // concat indented nodes
            if (indentedNodes) {
              for (i=0, l=indentedNodes.length; i<l; i++) {
                nodes = nodes.concat(indentedNodes[i]);

                // connect logical lines with a space, skipping the next-to-last line
                if (i < l - 1) { nodes.push(' '); }
              }
            }

            // add trailing space to non-indented nodes if special modifier
            if (s === LINE_SPACE_MODIFIERS.SPACE) {
              nodes.push(' ');
            } else if (s === LINE_SPACE_MODIFIERS.NEWLINE) {
              nodes.push('\n');
            }

            return castStringsToTextNodes(nodes);
          },
          peg$c162 = function(first, tail) {
            return flattenArray(first, tail);
          },
          peg$c163 = function(first, tail) { return flattenArray(first, tail); },
          peg$c164 = "{",
          peg$c165 = { type: "literal", value: "{", description: "\"{\"" },
          peg$c166 = /^[^}]/,
          peg$c167 = { type: "class", value: "[^}]", description: "[^}]" },
          peg$c168 = function(text) {
            return text;
          },
          peg$c169 = function(content) {
            return builder.generateMustache( prepareMustachValue(content), true);
          },
          peg$c170 = function(content) {
            return builder.generateMustache( prepareMustachValue(content), false);
          },
          peg$c171 = function(m) {
              return builder.generateMustache( m, true );
            },
          peg$c172 = { type: "other", description: "_4SingleMustacheOpen" },
          peg$c173 = { type: "other", description: "_4DoubleMustacheOpen" },
          peg$c174 = "{{",
          peg$c175 = { type: "literal", value: "{{", description: "\"{{\"" },
          peg$c176 = { type: "other", description: "_4TripleMustacheOpen" },
          peg$c177 = "{{{",
          peg$c178 = { type: "literal", value: "{{{", description: "\"{{{\"" },
          peg$c179 = { type: "other", description: "_4SingleMustacheClose" },
          peg$c180 = "}",
          peg$c181 = { type: "literal", value: "}", description: "\"}\"" },
          peg$c182 = { type: "other", description: "_4DoubleMustacheClose" },
          peg$c183 = "}}",
          peg$c184 = { type: "literal", value: "}}", description: "\"}}\"" },
          peg$c185 = { type: "other", description: "_4TripleMustacheClose" },
          peg$c186 = "}}}",
          peg$c187 = { type: "literal", value: "}}}", description: "\"}}}\"" },
          peg$c188 = { type: "other", description: "_4SubexpressionOpen" },
          peg$c189 = { type: "other", description: "_4SubexpressionClose" },
          peg$c190 = { type: "other", description: "_4InterpolationOpen" },
          peg$c191 = "#{",
          peg$c192 = { type: "literal", value: "#{", description: "\"#{\"" },
          peg$c193 = { type: "other", description: "_4InterpolationClose" },
          peg$c194 = "==",
          peg$c195 = { type: "literal", value: "==", description: "\"==\"" },
          peg$c196 = function() { return false; },
          peg$c197 = function() { return true; },
          peg$c198 = function(h, s) { return h || s; },
          peg$c199 = " [",
          peg$c200 = { type: "literal", value: " [", description: "\" [\"" },
          peg$c201 = function(h, inTagMustaches, fullAttributes) {
            return parseInHtml(h, inTagMustaches, fullAttributes);
          },
          peg$c202 = function(s) { return { shorthand: s, id: true}; },
          peg$c203 = function(s) { return { shorthand: s }; },
          peg$c204 = function(shorthands) {
            var id, classes = [];
            for(var i = 0, len = shorthands.length; i < len; ++i) {
              var shorthand = shorthands[i];
              if(shorthand.id) {
                id = shorthand.shorthand;
              } else {
                classes.push(shorthand.shorthand);
              }
            }

            return [id, classes];
          },
          peg$c205 = function(a) {
            return a || [];
          },
          peg$c206 = function(a) {
            if (a.length) {
              return a;
            } else {
              return [];
            }
          },
          peg$c207 = /^[A-Za-z.0-9_\-]/,
          peg$c208 = { type: "class", value: "[A-Za-z.0-9_\\-]", description: "[A-Za-z.0-9_\\-]" },
          peg$c209 = function(id) { return id; },
          peg$c210 = function(event, mustacheNode) {
            var actionBody, parts;

            if (typeof mustacheNode === 'string') {
              actionBody = mustacheNode;
            } else {
              parts = mustacheNode[1].split(' ');
              if (parts.length === 1) {
                actionBody = '"' + parts[0] + '"';
              } else {
                actionBody = mustacheNode[1];
              }
            }

            var actionContent = ['action'];
            actionContent.push(actionBody);
            actionContent.push('on="'+event+'"');
            return [builder.generateMustache(actionContent.join(' '))];
          },
          peg$c211 = function(key, boolValue) {
            if (boolValue === 'true') {
              return [key];
            }
          },
          peg$c212 = function(value) { return value.replace(/ *$/, ''); },
          peg$c213 = /^[.()]/,
          peg$c214 = { type: "class", value: "[.()]", description: "[.()]" },
          peg$c215 = /^[^"']/,
          peg$c216 = { type: "class", value: "[^\"']", description: "[^\"']" },
          peg$c217 = /^[']/,
          peg$c218 = { type: "class", value: "[']", description: "[']" },
          peg$c219 = /^["]/,
          peg$c220 = { type: "class", value: "[\"]", description: "[\"]" },
          peg$c221 = function(key, value) {
            value = value.trim();

            // Class logic needs to be coalesced, except if it is an inline if statement
            if (key === 'class') {
              if (value.indexOf('if') === 0) {
                return builder.generateClassNameBinding(value);
              } else {
                return splitValueIntoClassBindings(value);
              }
            } else {
              return builder.generateAssignedMustache(value, key);
            }
          },
          peg$c222 = function(key, value) {
            if (key === 'class') {
              return splitValueIntoClassBindings(value);
            } else {
              return builder.generateAssignedMustache(value, key);
            }
          },
          peg$c223 = function(key, id) {
            return [key, '{{' + id + '}}'];
          },
          peg$c224 = function(key, nodes) {
            var strings = [];
            nodes.forEach(function(node){
              if (typeof node === 'string') {
                strings.push(node);
              } else {
                // FIXME here we transform a mustache attribute
                // This should be handled higher up instead, not here.
                // This happens when the attribute is something like:
                // src="{{unbound post.showLogoUrl}}".
                // key = "src", nodes[0] = "unbound post.showLogoUrl"
                if (node.escaped) {
                  strings.push('{{' + node.content + '}}');
                } else {
                  strings.push('{{{' + node.content + '}}}');
                }
              }
            });
            var result = [key, strings.join('')];
            return result;
          },
          peg$c225 = "_",
          peg$c226 = { type: "literal", value: "_", description: "\"_\"" },
          peg$c227 = function(c) { return c;},
          peg$c228 = { type: "other", description: "_4CSSIdentifier" },
          peg$c229 = /^[_a-zA-Z0-9\-]/,
          peg$c230 = { type: "class", value: "[_a-zA-Z0-9\\-]", description: "[_a-zA-Z0-9\\-]" },
          peg$c231 = /^[_a-zA-Z]/,
          peg$c232 = { type: "class", value: "[_a-zA-Z]", description: "[_a-zA-Z]" },
          peg$c233 = /^[\x80-\xFF]/,
          peg$c234 = { type: "class", value: "[\\x80-\\xFF]", description: "[\\x80-\\xFF]" },
          peg$c235 = { type: "other", description: "_4KnownHTMLTagName" },
          peg$c236 = function(t) { return !!KNOWN_TAGS[t]; },
          peg$c237 = function(t) { return t; },
          peg$c238 = { type: "other", description: "_4a JS event" },
          peg$c239 = function(t) { return !!KNOWN_EVENTS[t]; },
          peg$c240 = { type: "other", description: "_4INDENT" },
          peg$c241 = { type: "other", description: "_4DEDENT" },
          peg$c242 = { type: "other", description: "_4Unmatched DEDENT" },
          peg$c243 = function(t) { return preprocessor.UNMATCHED_DEDENT_SYMBOL === t; },
          peg$c244 = { type: "other", description: "_4LineEnd" },
          peg$c245 = { type: "other", description: "_4ANYDEDENT" },
          peg$c246 = { type: "other", description: "_4RequiredWhitespace" },
          peg$c247 = { type: "other", description: "_4OptionalWhitespace" },
          peg$c248 = { type: "other", description: "_4InlineWhitespace" },
          peg$c249 = /^[ \t]/,
          peg$c250 = { type: "class", value: "[ \\t]", description: "[ \\t]" },

          peg$currPos          = 0,
          peg$reportedPos      = 0,
          peg$cachedPos        = 0,
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
          peg$maxFailPos       = 0,
          peg$maxFailExpected  = [],
          peg$silentFails      = 0,

          peg$result;

      if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }

        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }

      function text() {
        return input.substring(peg$reportedPos, peg$currPos);
      }

      function offset() {
        return peg$reportedPos;
      }

      function line() {
        return peg$computePosDetails(peg$reportedPos).line;
      }

      function column() {
        return peg$computePosDetails(peg$reportedPos).column;
      }

      function expected(description) {
        throw peg$buildException(
          null,
          [{ type: "other", description: description }],
          peg$reportedPos
        );
      }

      function error(message) {
        throw peg$buildException(message, null, peg$reportedPos);
      }

      function peg$computePosDetails(pos) {
        function advance(details, startPos, endPos) {
          var p, ch;

          for (p = startPos; p < endPos; p++) {
            ch = input.charAt(p);
            if (ch === "\n") {
              if (!details.seenCR) { details.line++; }
              details.column = 1;
              details.seenCR = false;
            } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
              details.line++;
              details.column = 1;
              details.seenCR = true;
            } else {
              details.column++;
              details.seenCR = false;
            }
          }
        }

        if (peg$cachedPos !== pos) {
          if (peg$cachedPos > pos) {
            peg$cachedPos = 0;
            peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
          }
          advance(peg$cachedPosDetails, peg$cachedPos, pos);
          peg$cachedPos = pos;
        }

        return peg$cachedPosDetails;
      }

      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) { return; }

        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }

        peg$maxFailExpected.push(expected);
      }

      function peg$buildException(message, expected, pos) {
        function cleanupExpected(expected) {
          var i = 1;

          expected.sort(function(a, b) {
            if (a.description < b.description) {
              return -1;
            } else if (a.description > b.description) {
              return 1;
            } else {
              return 0;
            }
          });

          while (i < expected.length) {
            if (expected[i - 1] === expected[i]) {
              expected.splice(i, 1);
            } else {
              i++;
            }
          }
        }

        function buildMessage(expected, found) {
          function stringEscape(s) {
            function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

            return s
              .replace(/\\/g,   '\\\\')
              .replace(/"/g,    '\\"')
              .replace(/\x08/g, '\\b')
              .replace(/\t/g,   '\\t')
              .replace(/\n/g,   '\\n')
              .replace(/\f/g,   '\\f')
              .replace(/\r/g,   '\\r')
              .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
              .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
              .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
              .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
          }

          var expectedDescs = new Array(expected.length),
              expectedDesc, foundDesc, i;

          for (i = 0; i < expected.length; i++) {
            expectedDescs[i] = expected[i].description;
          }

          expectedDesc = expected.length > 1
            ? expectedDescs.slice(0, -1).join(", ")
                + " or "
                + expectedDescs[expected.length - 1]
            : expectedDescs[0];

          foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

          return "Expected " + expectedDesc + " but " + foundDesc + " found.";
        }

        var posDetails = peg$computePosDetails(pos),
            found      = pos < input.length ? input.charAt(pos) : null;

        if (expected !== null) {
          cleanupExpected(expected);
        }

        return new SyntaxError(
          message !== null ? message : buildMessage(expected, found),
          expected,
          found,
          pos,
          posDetails.line,
          posDetails.column
        );
      }

      function peg$parse_0newMustacheNameChar() {
        var s0;

        if (peg$c0.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c1); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c2.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c3); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
              s0 = peg$c4;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c5); }
            }
            if (s0 === peg$FAILED) {
              s0 = peg$parse_0m_arrayIndex();
              if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 46) {
                  s0 = peg$c6;
                  peg$currPos++;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c7); }
                }
              }
            }
          }
        }

        return s0;
      }

      function peg$parse_0m_arrayIndex() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c6;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c7); }
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 91) {
            s2 = peg$c9;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c10); }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_0newMustacheNameChar();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_0newMustacheNameChar();
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 93) {
                s4 = peg$c12;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c13); }
              }
              if (s4 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1newMustacheAttrValue() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parse_1m_invalidValueStartChar();
        if (s2 === peg$FAILED) {
          s2 = peg$parse_1m_blockStart();
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c14;
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_1m_quotedString();
          if (s2 === peg$FAILED) {
            s2 = peg$parse_1m_valuePath();
            if (s2 === peg$FAILED) {
              s2 = peg$parse_1m_parenthetical();
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_1m_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_1m_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c15(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_blockStart() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c16) {
          s1 = peg$c16;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c17); }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_1m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_1m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 124) {
              s3 = peg$c18;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c19); }
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_invalidValueStartChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 47) {
          s0 = peg$c20;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c21); }
        }

        return s0;
      }

      function peg$parse_1m_quotedString() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c22;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c23); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_1m_stringWithoutDouble();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c22;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c24;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_1m_stringWithoutSingle();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c24;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c25); }
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c8;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
          if (s1 !== peg$FAILED) {
            s1 = input.substring(s0, peg$currPos);
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parse_1m_valuePath() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_0newMustacheNameChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_0newMustacheNameChar();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_parenthetical() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$currPos;
          s4 = peg$parse_1m_OPEN_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parse_1m_inParensChar();
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              s6 = peg$parse_1m_inParensChar();
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_1m_parenthetical();
              if (s6 === peg$FAILED) {
                s6 = peg$c26;
              }
              if (s6 !== peg$FAILED) {
                s7 = [];
                s8 = peg$parse_1m_inParensChar();
                while (s8 !== peg$FAILED) {
                  s7.push(s8);
                  s8 = peg$parse_1m_inParensChar();
                }
                if (s7 !== peg$FAILED) {
                  s8 = peg$parse_1m_CLOSE_PAREN();
                  if (s8 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c8;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_1m_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_1m_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c27(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_1m_inParensChar() {
        var s0;

        if (peg$c28.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }

        return s0;
      }

      function peg$parse_1m_stringWithoutDouble() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c24;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_inStringChar();
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 39) {
              s2 = peg$c24;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c25); }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_stringWithoutSingle() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_1m_inStringChar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s2 = peg$c22;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c23); }
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_1m_inStringChar();
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s2 = peg$c22;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_1m_inStringChar() {
        var s0;

        if (peg$c30.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c31); }
        }

        return s0;
      }

      function peg$parse_1m_OPEN_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c32;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }

        return s0;
      }

      function peg$parse_1m_CLOSE_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 41) {
          s0 = peg$c34;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c35); }
        }

        return s0;
      }

      function peg$parse_1m_() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c36;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }

        return s0;
      }

      function peg$parse_2mustacheAttrs() {
        var s0, s1;

        s0 = peg$parse_2m_bracketedAttrs();
        if (s0 === peg$FAILED) {
          s0 = [];
          s1 = peg$parse_2newMustacheAttr();
          while (s1 !== peg$FAILED) {
            s0.push(s1);
            s1 = peg$parse_2newMustacheAttr();
          }
        }

        return s0;
      }

      function peg$parse_2m_bracketedAttrs() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        s1 = peg$parse_2m_openBracket();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = [];
          s5 = peg$parse_2m_();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parse_2m_();
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_2newMustacheAttr();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_2m_TERM();
              if (s6 === peg$FAILED) {
                s6 = peg$c26;
              }
              if (s6 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c38(s5);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = [];
            s5 = peg$parse_2m_();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parse_2m_();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_2newMustacheAttr();
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_2m_TERM();
                if (s6 === peg$FAILED) {
                  s6 = peg$c26;
                }
                if (s6 !== peg$FAILED) {
                  peg$reportedPos = s3;
                  s4 = peg$c38(s5);
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            peg$silentFails++;
            s4 = peg$parse_2m_closeBracket();
            peg$silentFails--;
            if (s4 !== peg$FAILED) {
              peg$currPos = s3;
              s3 = peg$c14;
            } else {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c39(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2newMustacheAttr() {
        var s0;

        s0 = peg$parse_2m_keyValue();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_2m_parenthetical();
          if (s0 === peg$FAILED) {
            s0 = peg$parse_1newMustacheAttrValue();
          }
        }

        return s0;
      }

      function peg$parse_2m_keyValue() {
        var s0, s1, s2, s3, s4, s5, s6, s7;

        s0 = peg$currPos;
        s1 = peg$parse_2newMustacheAttrName();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_2m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_2m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 61) {
              s3 = peg$c40;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c41); }
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parse_2m_();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parse_2m_();
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_1newMustacheAttrValue();
                if (s5 !== peg$FAILED) {
                  s6 = [];
                  s7 = peg$parse_2m_();
                  while (s7 !== peg$FAILED) {
                    s6.push(s7);
                    s7 = peg$parse_2m_();
                  }
                  if (s6 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c42(s1, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2newMustacheAttrName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_2newMustacheNameChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_2newMustacheNameChar();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_2m_parenthetical() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_2m_();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_2m_();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$currPos;
          s4 = peg$parse_2m_OPEN_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parse_2m_inParensChar();
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              s6 = peg$parse_2m_inParensChar();
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_2m_parenthetical();
              if (s6 === peg$FAILED) {
                s6 = peg$c26;
              }
              if (s6 !== peg$FAILED) {
                s7 = [];
                s8 = peg$parse_2m_inParensChar();
                while (s8 !== peg$FAILED) {
                  s7.push(s8);
                  s8 = peg$parse_2m_inParensChar();
                }
                if (s7 !== peg$FAILED) {
                  s8 = peg$parse_2m_CLOSE_PAREN();
                  if (s8 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c8;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_2m_();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_2m_();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c27(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2m_inParensChar() {
        var s0;

        if (peg$c28.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }

        return s0;
      }

      function peg$parse_2m_OPEN_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c32;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }

        return s0;
      }

      function peg$parse_2m_CLOSE_PAREN() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 41) {
          s0 = peg$c34;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c35); }
        }

        return s0;
      }

      function peg$parse_2m_() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c36;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }

        return s0;
      }

      function peg$parse_2m_openBracket() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 91) {
          s1 = peg$c9;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c10); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_2m_TERM();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_2m_INDENT();
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2m_closeBracket() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parse_2m_DEDENT();
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_2m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_2m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s3 = peg$c12;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c13); }
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_2m_INDENT() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.length > peg$currPos) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c45(s1);
          if (s2) {
            s2 = peg$c14;
          } else {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c46(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c43); }
        }

        return s0;
      }

      function peg$parse_2m_DEDENT() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.length > peg$currPos) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c48(s1);
          if (s2) {
            s2 = peg$c14;
          } else {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c46(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c47); }
        }

        return s0;
      }

      function peg$parse_2m_TERM() {
        var s0, s1, s2, s3, s4;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 13) {
          s1 = peg$c50;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c51); }
        }
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c44); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = peg$currPos;
            s3 = peg$c52(s2);
            if (s3) {
              s3 = peg$c14;
            } else {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 10) {
                s4 = peg$c53;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c54); }
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c55(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c49); }
        }

        return s0;
      }

      function peg$parse_2newMustacheNameChar() {
        var s0;

        if (peg$c0.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c1); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c2.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c3); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
              s0 = peg$c4;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c5); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 46) {
                s0 = peg$c6;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c7); }
              }
            }
          }
        }

        return s0;
      }

      function peg$parse_3newMustache() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parse_3newMustacheStart();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_3m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_3m_();
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_2mustacheAttrs();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_3m_blockParams();
              if (s4 === peg$FAILED) {
                s4 = peg$c26;
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c56(s1, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3newMustacheStart() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parse_3newMustacheName();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_3m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_3m_();
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_3newMustacheShortHand();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_3newMustacheShortHand();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c57(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3m_blockParams() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parse_3m_blockStart();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_3m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_3m_();
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_1newMustacheAttrValue();
            if (s4 !== peg$FAILED) {
              while (s4 !== peg$FAILED) {
                s3.push(s4);
                s4 = peg$parse_1newMustacheAttrValue();
              }
            } else {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 124) {
                s4 = peg$c18;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c19); }
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c58(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3m_blockStart() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c16) {
          s1 = peg$c16;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c17); }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parse_3m_();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parse_3m_();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 124) {
              s3 = peg$c18;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c19); }
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3newMustacheShortHand() {
        var s0;

        s0 = peg$parse_3m_shortHandTagName();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_3m_shortHandIdName();
          if (s0 === peg$FAILED) {
            s0 = peg$parse_3m_shortHandClassName();
          }
        }

        return s0;
      }

      function peg$parse_3m_shortHandTagName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 37) {
          s1 = peg$c59;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c60); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_3newMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c61(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3m_shortHandIdName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 35) {
          s1 = peg$c62;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c63); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_3newMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c64(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3m_shortHandClassName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c6;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c7); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_3newMustacheShortHandName();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c65(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3newMustacheShortHandName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        if (peg$c66.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c67); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (peg$c66.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c67); }
            }
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_3newMustacheName() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parse_3m_invalidNameStartChar();
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c14;
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          s4 = peg$parse_0newMustacheNameChar();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_0newMustacheNameChar();
            }
          } else {
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_3m_modifierChar();
            if (s3 === peg$FAILED) {
              s3 = peg$c26;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c68(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_3m_invalidNameStartChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 46) {
          s0 = peg$c6;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c7); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 45) {
            s0 = peg$c4;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c5); }
          }
          if (s0 === peg$FAILED) {
            if (peg$c69.test(input.charAt(peg$currPos))) {
              s0 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c70); }
            }
          }
        }

        return s0;
      }

      function peg$parse_3m_modifierChar() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 33) {
          s0 = peg$c71;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c72); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 63) {
            s0 = peg$c73;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c74); }
          }
        }

        return s0;
      }

      function peg$parse_3m_() {
        var s0;

        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c36;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }

        return s0;
      }

      function peg$parse_4start() {
        var s0;

        s0 = peg$parse_4program();

        return s0;
      }

      function peg$parse_4program() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parse_4content();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c75(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4content() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4statement();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_4statement();
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c76(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4statement() {
        var s0, s1;

        peg$silentFails++;
        s0 = peg$parse_4blankLine();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4comment();
          if (s0 === peg$FAILED) {
            s0 = peg$parse_4contentStatement();
          }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c77); }
        }

        return s0;
      }

      function peg$parse_4contentStatement() {
        var s0, s1;

        peg$silentFails++;
        s0 = peg$parse_4legacyPartialInvocation();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4htmlElement();
          if (s0 === peg$FAILED) {
            s0 = peg$parse_4textLine();
            if (s0 === peg$FAILED) {
              s0 = peg$parse_4mustache();
            }
          }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c78); }
        }

        return s0;
      }

      function peg$parse_4blankLine() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$parse_4_();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4TERM();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c79();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4legacyPartialInvocation() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 62) {
          s1 = peg$c80;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c81); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4legacyPartialName();
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parse_4inMustacheParam();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parse_4inMustacheParam();
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_4_();
                if (s5 !== peg$FAILED) {
                  s6 = peg$parse_4TERM();
                  if (s6 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c82(s3, s4);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4legacyPartialName() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        if (peg$c83.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c84); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c83.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c84); }
            }
          }
        } else {
          s2 = peg$c8;
        }
        if (s2 !== peg$FAILED) {
          s2 = input.substring(s1, peg$currPos);
        }
        s1 = s2;
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c85(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4mustache() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parse_4explicitMustache();
        if (s1 === peg$FAILED) {
          s1 = peg$parse_4lineStartingMustache();
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c86(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4commentContent() {
        var s0, s1, s2, s3, s4, s5, s6, s7;

        s0 = peg$currPos;
        s1 = peg$parse_4lineContent();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4TERM();
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$currPos;
            s5 = peg$parse_4indentation();
            if (s5 !== peg$FAILED) {
              s6 = [];
              s7 = peg$parse_4commentContent();
              if (s7 !== peg$FAILED) {
                while (s7 !== peg$FAILED) {
                  s6.push(s7);
                  s7 = peg$parse_4commentContent();
                }
              } else {
                s6 = peg$c8;
              }
              if (s6 !== peg$FAILED) {
                s7 = peg$parse_4anyDedent();
                if (s7 !== peg$FAILED) {
                  s5 = [s5, s6, s7];
                  s4 = s5;
                } else {
                  peg$currPos = s4;
                  s4 = peg$c8;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$c8;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$c8;
            }
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$currPos;
              s5 = peg$parse_4indentation();
              if (s5 !== peg$FAILED) {
                s6 = [];
                s7 = peg$parse_4commentContent();
                if (s7 !== peg$FAILED) {
                  while (s7 !== peg$FAILED) {
                    s6.push(s7);
                    s7 = peg$parse_4commentContent();
                  }
                } else {
                  s6 = peg$c8;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parse_4anyDedent();
                  if (s7 !== peg$FAILED) {
                    s5 = [s5, s6, s7];
                    s4 = s5;
                  } else {
                    peg$currPos = s4;
                    s4 = peg$c8;
                  }
                } else {
                  peg$currPos = s4;
                  s4 = peg$c8;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$c8;
              }
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c79();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4comment() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 47) {
          s1 = peg$c20;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c21); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4commentContent();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c79();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4inlineComment() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 47) {
          s1 = peg$c20;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c21); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4lineContent();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4lineStartingMustache() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parse_4capitalizedLineStarterMustache();
        if (s1 === peg$FAILED) {
          s1 = peg$parse_4mustacheOrBlock();
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c87(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4explicitMustache() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$parse_4equalSign();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4mustacheOrBlock();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c88(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4capitalizedLineStarterMustache() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        if (peg$c89.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c90); }
        }
        peg$silentFails--;
        if (s2 !== peg$FAILED) {
          peg$currPos = s1;
          s1 = peg$c14;
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4mustacheOrBlock();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c91(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4htmlNestedTextNodes() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 32) {
          s1 = peg$c36;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4textNodes();
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            s4 = peg$parse_4indentation();
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parse_4whitespaceableTextNodes();
              if (s6 !== peg$FAILED) {
                while (s6 !== peg$FAILED) {
                  s5.push(s6);
                  s6 = peg$parse_4whitespaceableTextNodes();
                }
              } else {
                s5 = peg$c8;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_4DEDENT();
                if (s6 !== peg$FAILED) {
                  s4 = [s4, s5, s6];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
            if (s3 === peg$FAILED) {
              s3 = peg$c26;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c92(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4indentedContent() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4blankLine();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_4blankLine();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4indentation();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4content();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_4DEDENT();
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c93(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4unindentedContent() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4blankLine();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_4blankLine();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4content();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4DEDENT();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c93(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4htmlTerminator() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$parse_4colonContent();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse_4_();
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_4explicitMustache();
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c94(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parse_4_();
            if (s1 !== peg$FAILED) {
              s2 = peg$parse_4inlineComment();
              if (s2 === peg$FAILED) {
                s2 = peg$c26;
              }
              if (s2 !== peg$FAILED) {
                s3 = peg$parse_4TERM();
                if (s3 !== peg$FAILED) {
                  s4 = peg$parse_4indentedContent();
                  if (s4 === peg$FAILED) {
                    s4 = peg$c26;
                  }
                  if (s4 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c93(s4);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parse_4_();
              if (s1 !== peg$FAILED) {
                s2 = peg$parse_4inlineComment();
                if (s2 === peg$FAILED) {
                  s2 = peg$c26;
                }
                if (s2 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 93) {
                    s3 = peg$c12;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c13); }
                  }
                  if (s3 !== peg$FAILED) {
                    s4 = peg$parse_4TERM();
                    if (s4 !== peg$FAILED) {
                      s5 = peg$parse_4unindentedContent();
                      if (s5 === peg$FAILED) {
                        s5 = peg$c26;
                      }
                      if (s5 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c93(s5);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c8;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c8;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parse_4htmlNestedTextNodes();
                if (s1 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c95(s1);
                }
                s0 = s1;
              }
            }
          }
        }

        return s0;
      }

      function peg$parse_4htmlElement() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$parse_4inHtmlTag();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4htmlTerminator();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c96(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4mustacheOrBlock() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parse_4inMustache();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4inlineComment();
            if (s3 === peg$FAILED) {
              s3 = peg$c26;
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_4mustacheNestedContent();
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c97(s1, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4colonContent() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c98) {
          s1 = peg$c98;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c99); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4contentStatement();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c93(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4mustacheNestedContent() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        s1 = peg$parse_4colonContent();
        if (s1 === peg$FAILED) {
          s1 = peg$parse_4textLine();
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c100(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse_4_();
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s2 = peg$c12;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c13); }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parse_4TERM();
              if (s3 !== peg$FAILED) {
                s4 = peg$parse_4colonContent();
                if (s4 === peg$FAILED) {
                  s4 = peg$parse_4textLine();
                  if (s4 === peg$FAILED) {
                    s4 = peg$parse_4htmlElement();
                  }
                }
                if (s4 !== peg$FAILED) {
                  s5 = peg$parse_4DEDENT();
                  if (s5 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c101(s4);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parse_4TERM();
            if (s1 !== peg$FAILED) {
              s2 = peg$currPos;
              s3 = [];
              s4 = peg$parse_4blankLine();
              while (s4 !== peg$FAILED) {
                s3.push(s4);
                s4 = peg$parse_4blankLine();
              }
              if (s3 !== peg$FAILED) {
                s4 = peg$parse_4indentation();
                if (s4 !== peg$FAILED) {
                  s5 = peg$parse_4invertibleContent();
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parse_4DEDENT();
                    if (s6 !== peg$FAILED) {
                      peg$reportedPos = s2;
                      s3 = peg$c102(s5);
                      s2 = s3;
                    } else {
                      peg$currPos = s2;
                      s2 = peg$c8;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c8;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c8;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c8;
              }
              if (s2 === peg$FAILED) {
                s2 = peg$c26;
              }
              if (s2 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c103(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parse_4_();
              if (s1 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 93) {
                  s2 = peg$c12;
                  peg$currPos++;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c13); }
                }
                if (s2 !== peg$FAILED) {
                  s3 = peg$parse_4TERM();
                  if (s3 !== peg$FAILED) {
                    s4 = peg$parse_4invertibleContent();
                    if (s4 !== peg$FAILED) {
                      s5 = peg$parse_4DEDENT();
                      if (s5 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c103(s4);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c8;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c8;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parse_4_();
                if (s1 !== peg$FAILED) {
                  s2 = peg$parse_4DEDENT();
                  if (s2 === peg$FAILED) {
                    s2 = peg$c26;
                  }
                  if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 93) {
                      s3 = peg$c12;
                      peg$currPos++;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c13); }
                    }
                    if (s3 !== peg$FAILED) {
                      s4 = peg$parse_4TERM();
                      if (s4 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c104();
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c8;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c8;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              }
            }
          }
        }

        return s0;
      }

      function peg$parse_4invertibleContent() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$parse_4content();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4invertibleObject();
          if (s2 === peg$FAILED) {
            s2 = peg$c26;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c105(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4invertibleObject() {
        var s0, s1, s2, s3, s4, s5, s6, s7;

        s0 = peg$currPos;
        s1 = peg$parse_4DEDENT();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4else();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4_();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_4invertibleParam();
              if (s4 === peg$FAILED) {
                s4 = peg$c26;
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_4TERM();
                if (s5 !== peg$FAILED) {
                  s6 = peg$parse_4invertibleBlock();
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parse_4invertibleObject();
                    if (s7 === peg$FAILED) {
                      s7 = peg$c26;
                    }
                    if (s7 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c106(s2, s4, s6, s7);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c8;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4else() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 61) {
          s2 = peg$c40;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c41); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_4_();
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          if (input.substr(peg$currPos, 4) === peg$c107) {
            s3 = peg$c107;
            peg$currPos += 4;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c108); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_4_();
            if (s4 !== peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c109) {
                s5 = peg$c109;
                peg$currPos += 2;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c110); }
              }
              if (s5 === peg$FAILED) {
                s5 = peg$c26;
              }
              if (s5 !== peg$FAILED) {
                s3 = [s3, s4, s5];
                s2 = s3;
              } else {
                peg$currPos = s2;
                s2 = peg$c8;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c8;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c111(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4invertibleParam() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parse_2mustacheAttrs();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4inlineComment();
            if (s3 === peg$FAILED) {
              s3 = peg$c26;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c112(s1);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4invertibleBlock() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4blankLine();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_4blankLine();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4indentation();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4content();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c93(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4inMustache() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 62) {
          s1 = peg$c80;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c81); }
        }
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          peg$silentFails++;
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 91) {
            s4 = peg$c9;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c10); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_4TERM();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          peg$silentFails--;
          if (s3 === peg$FAILED) {
            s2 = peg$c14;
          } else {
            peg$currPos = s2;
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4_();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_3newMustache();
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_4inlineComment();
                if (s5 === peg$FAILED) {
                  s5 = peg$c26;
                }
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c113(s1, s4);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4htmlMustacheAttribute() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parse_4_();
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$parse_4tagNameShorthand();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s2;
            s3 = peg$c114(s3);
          }
          s2 = s3;
          if (s2 === peg$FAILED) {
            s2 = peg$currPos;
            s3 = peg$parse_4idShorthand();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s2;
              s3 = peg$c115(s3);
            }
            s2 = s3;
            if (s2 === peg$FAILED) {
              s2 = peg$currPos;
              s3 = peg$parse_4classShorthand();
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s2;
                s3 = peg$c116(s3);
              }
              s2 = s3;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c117(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4inMustacheParam() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parse_4htmlMustacheAttribute();
        if (s1 === peg$FAILED) {
          s1 = peg$currPos;
          s2 = peg$parse_4__();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4param();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s1;
              s2 = peg$c112(s3);
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c118(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4pathIdent() {
        var s0, s1, s2, s3, s4;

        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c120) {
          s0 = peg$c120;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c121); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 46) {
            s0 = peg$c6;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$currPos;
            s2 = [];
            if (peg$c122.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c123); }
            }
            if (s3 !== peg$FAILED) {
              while (s3 !== peg$FAILED) {
                s2.push(s3);
                if (peg$c122.test(input.charAt(peg$currPos))) {
                  s3 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c123); }
                }
              }
            } else {
              s2 = peg$c8;
            }
            if (s2 !== peg$FAILED) {
              s2 = input.substring(s1, peg$currPos);
            }
            s1 = s2;
            if (s1 !== peg$FAILED) {
              s2 = peg$currPos;
              peg$silentFails++;
              if (input.charCodeAt(peg$currPos) === 61) {
                s3 = peg$c40;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c41); }
              }
              peg$silentFails--;
              if (s3 === peg$FAILED) {
                s2 = peg$c14;
              } else {
                peg$currPos = s2;
                s2 = peg$c8;
              }
              if (s2 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c124(s1);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 91) {
                s1 = peg$c9;
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c10); }
              }
              if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                s3 = [];
                if (peg$c125.test(input.charAt(peg$currPos))) {
                  s4 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c126); }
                }
                while (s4 !== peg$FAILED) {
                  s3.push(s4);
                  if (peg$c125.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c126); }
                  }
                }
                if (s3 !== peg$FAILED) {
                  s3 = input.substring(s2, peg$currPos);
                }
                s2 = s3;
                if (s2 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 93) {
                    s3 = peg$c12;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c13); }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c127(s2);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            }
          }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c119); }
        }

        return s0;
      }

      function peg$parse_4key() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4nmchar();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 58) {
            s2 = peg$c129;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c130); }
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_4nmchar();
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 58) {
              s2 = peg$c129;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c130); }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c128); }
        }

        return s0;
      }

      function peg$parse_4param() {
        var s0;

        s0 = peg$parse_4booleanNode();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4integerNode();
          if (s0 === peg$FAILED) {
            s0 = peg$parse_4pathIdNode();
            if (s0 === peg$FAILED) {
              s0 = peg$parse_4stringNode();
            }
          }
        }

        return s0;
      }

      function peg$parse_4path() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parse_4pathIdent();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parse_4separator();
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_4pathIdent();
            if (s5 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c131(s4, s5);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parse_4separator();
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_4pathIdent();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c131(s4, s5);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c132(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4separator() {
        var s0, s1;

        peg$silentFails++;
        if (peg$c134.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c135); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c133); }
        }

        return s0;
      }

      function peg$parse_4pathIdNode() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parse_4path();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c136(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4stringNode() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parse_4string();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c137(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4integerNode() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parse_4integer();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c138(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4booleanNode() {
        var s0, s1;

        s0 = peg$currPos;
        s1 = peg$parse_4boolean();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c139(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4boolean() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 4) === peg$c141) {
          s0 = peg$c141;
          peg$currPos += 4;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c142); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c143) {
            s0 = peg$c143;
            peg$currPos += 5;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c144); }
          }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c140); }
        }

        return s0;
      }

      function peg$parse_4integer() {
        var s0, s1, s2, s3, s4, s5;

        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 45) {
          s3 = peg$c4;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c5); }
        }
        if (s3 === peg$FAILED) {
          s3 = peg$c26;
        }
        if (s3 !== peg$FAILED) {
          s4 = [];
          if (peg$c69.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c70); }
          }
          if (s5 !== peg$FAILED) {
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              if (peg$c69.test(input.charAt(peg$currPos))) {
                s5 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c70); }
              }
            }
          } else {
            s4 = peg$c8;
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$c8;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c8;
        }
        if (s2 !== peg$FAILED) {
          s2 = input.substring(s1, peg$currPos);
        }
        s1 = s2;
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c146(s1);
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c145); }
        }

        return s0;
      }

      function peg$parse_4string() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c22;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c23); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_4hashDoubleQuoteStringValue();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c22;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 === peg$FAILED) {
          s1 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c24;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4hashSingleQuoteStringValue();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c24;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c25); }
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c8;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c147(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4stringWithQuotes() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c22;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c23); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_4hashDoubleQuoteStringValue();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c22;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 === peg$FAILED) {
          s1 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c24;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4hashSingleQuoteStringValue();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c24;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c25); }
              }
              if (s4 !== peg$FAILED) {
                s2 = [s2, s3, s4];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c8;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c27(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4hashDoubleQuoteStringValue() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$currPos;
        s3 = peg$currPos;
        peg$silentFails++;
        s4 = peg$parse_4TERM();
        peg$silentFails--;
        if (s4 === peg$FAILED) {
          s3 = peg$c14;
        } else {
          peg$currPos = s3;
          s3 = peg$c8;
        }
        if (s3 !== peg$FAILED) {
          if (peg$c148.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c149); }
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$c8;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c8;
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parse_4TERM();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = peg$c14;
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            if (peg$c148.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c149); }
            }
            if (s4 !== peg$FAILED) {
              s3 = [s3, s4];
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$c8;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c8;
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4hashSingleQuoteStringValue() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$currPos;
        s3 = peg$currPos;
        peg$silentFails++;
        s4 = peg$parse_4TERM();
        peg$silentFails--;
        if (s4 === peg$FAILED) {
          s3 = peg$c14;
        } else {
          peg$currPos = s3;
          s3 = peg$c8;
        }
        if (s3 !== peg$FAILED) {
          if (peg$c150.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c151); }
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$c8;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c8;
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parse_4TERM();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = peg$c14;
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            if (peg$c150.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c151); }
            }
            if (s4 !== peg$FAILED) {
              s3 = [s3, s4];
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$c8;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c8;
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4alpha() {
        var s0;

        if (peg$c152.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c153); }
        }

        return s0;
      }

      function peg$parse_4whitespaceableTextNodes() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parse_4indentation();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4textNodes();
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_4whitespaceableTextNodes();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_4whitespaceableTextNodes();
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_4anyDedent();
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c154(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4textNodes();
        }

        return s0;
      }

      function peg$parse_4textLineStart() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (peg$c155.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c156); }
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 32) {
            s2 = peg$c36;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c37); }
          }
          if (s2 === peg$FAILED) {
            s2 = peg$c26;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c124(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$currPos;
          peg$silentFails++;
          if (input.charCodeAt(peg$currPos) === 60) {
            s2 = peg$c157;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c158); }
          }
          peg$silentFails--;
          if (s2 !== peg$FAILED) {
            peg$currPos = s1;
            s1 = peg$c14;
          } else {
            s1 = peg$c8;
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c159();
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parse_4textLine() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        s1 = peg$parse_4textLineStart();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4textNodes();
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            s4 = peg$parse_4indentation();
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parse_4whitespaceableTextNodes();
              while (s6 !== peg$FAILED) {
                s5.push(s6);
                s6 = peg$parse_4whitespaceableTextNodes();
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_4DEDENT();
                if (s6 !== peg$FAILED) {
                  peg$reportedPos = s3;
                  s4 = peg$c160(s5);
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c8;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
            if (s3 === peg$FAILED) {
              s3 = peg$c26;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c161(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4textNodes() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parse_4preMustacheText();
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parse_4rawMustache();
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_4preMustacheText();
            if (s5 === peg$FAILED) {
              s5 = peg$c26;
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parse_4rawMustache();
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_4preMustacheText();
              if (s5 === peg$FAILED) {
                s5 = peg$c26;
              }
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4TERM();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c162(s1, s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4attributeTextNodes() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 34) {
          s1 = peg$c22;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c23); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4attributeTextNodesInner();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s3 = peg$c22;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c118(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 39) {
            s1 = peg$c24;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_4attributeTextNodesInnerSingle();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 39) {
                s3 = peg$c24;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c25); }
              }
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c118(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        }

        return s0;
      }

      function peg$parse_4attributeTextNodesInner() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parse_4preAttrMustacheText();
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parse_4rawMustache();
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_4preAttrMustacheText();
            if (s5 === peg$FAILED) {
              s5 = peg$c26;
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parse_4rawMustache();
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_4preAttrMustacheText();
              if (s5 === peg$FAILED) {
                s5 = peg$c26;
              }
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c163(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4attributeTextNodesInnerSingle() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parse_4preAttrMustacheTextSingle();
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parse_4rawMustache();
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_4preAttrMustacheTextSingle();
            if (s5 === peg$FAILED) {
              s5 = peg$c26;
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c8;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parse_4rawMustache();
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_4preAttrMustacheTextSingle();
              if (s5 === peg$FAILED) {
                s5 = peg$c26;
              }
              if (s5 !== peg$FAILED) {
                s4 = [s4, s5];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c8;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c8;
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c163(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4rawMustache() {
        var s0;

        s0 = peg$parse_4rawMustacheUnescaped();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4rawMustacheEscaped();
        }

        return s0;
      }

      function peg$parse_4recursivelyParsedMustacheContent() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 123) {
          s2 = peg$c164;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c165); }
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c14;
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          if (peg$c166.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c167); }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            if (peg$c166.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c167); }
            }
          }
          if (s3 !== peg$FAILED) {
            s3 = input.substring(s2, peg$currPos);
          }
          s2 = s3;
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c168(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4rawMustacheEscaped() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parse_4doubleOpen();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4recursivelyParsedMustacheContent();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_4_();
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_4doubleClose();
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c169(s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse_4hashStacheOpen();
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_4_();
            if (s2 !== peg$FAILED) {
              s3 = peg$parse_4recursivelyParsedMustacheContent();
              if (s3 !== peg$FAILED) {
                s4 = peg$parse_4_();
                if (s4 !== peg$FAILED) {
                  s5 = peg$parse_4hashStacheClose();
                  if (s5 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c169(s3);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        }

        return s0;
      }

      function peg$parse_4rawMustacheUnescaped() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parse_4tripleOpen();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4recursivelyParsedMustacheContent();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_4_();
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_4tripleClose();
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c170(s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4preAttrMustacheText() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4preAttrMustacheUnit();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_4preAttrMustacheUnit();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4preAttrMustacheTextSingle() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4preAttrMustacheUnitSingle();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_4preAttrMustacheUnitSingle();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4preAttrMustacheUnit() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parse_4nonMustacheUnit();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s2 = peg$c22;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c23); }
          }
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c14;
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c44); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c93(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4preAttrMustacheUnitSingle() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parse_4nonMustacheUnit();
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c24;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c14;
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c44); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c93(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4preMustacheText() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4preMustacheUnit();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_4preMustacheUnit();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4preMustacheUnit() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parse_4nonMustacheUnit();
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c14;
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c44); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c93(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4nonMustacheUnit() {
        var s0;

        s0 = peg$parse_4tripleOpen();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4doubleOpen();
          if (s0 === peg$FAILED) {
            s0 = peg$parse_4hashStacheOpen();
            if (s0 === peg$FAILED) {
              s0 = peg$parse_4anyDedent();
              if (s0 === peg$FAILED) {
                s0 = peg$parse_4TERM();
              }
            }
          }
        }

        return s0;
      }

      function peg$parse_4rawMustacheSingle() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parse_4singleOpen();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4recursivelyParsedMustacheContent();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_4_();
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_4singleClose();
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c171(s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4inTagMustache() {
        var s0;

        s0 = peg$parse_4rawMustacheSingle();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4rawMustacheUnescaped();
          if (s0 === peg$FAILED) {
            s0 = peg$parse_4rawMustacheEscaped();
          }
        }

        return s0;
      }

      function peg$parse_4singleOpen() {
        var s0, s1;

        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 123) {
          s0 = peg$c164;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c165); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c172); }
        }

        return s0;
      }

      function peg$parse_4doubleOpen() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c174) {
          s0 = peg$c174;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c175); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c173); }
        }

        return s0;
      }

      function peg$parse_4tripleOpen() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 3) === peg$c177) {
          s0 = peg$c177;
          peg$currPos += 3;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c178); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c176); }
        }

        return s0;
      }

      function peg$parse_4singleClose() {
        var s0, s1;

        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 125) {
          s0 = peg$c180;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c181); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c179); }
        }

        return s0;
      }

      function peg$parse_4doubleClose() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c183) {
          s0 = peg$c183;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c184); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c182); }
        }

        return s0;
      }

      function peg$parse_4tripleClose() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 3) === peg$c186) {
          s0 = peg$c186;
          peg$currPos += 3;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c187); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c185); }
        }

        return s0;
      }

      function peg$parse_4sexprOpen() {
        var s0, s1;

        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 40) {
          s0 = peg$c32;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c188); }
        }

        return s0;
      }

      function peg$parse_4sexprClose() {
        var s0, s1;

        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 41) {
          s0 = peg$c34;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c35); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c189); }
        }

        return s0;
      }

      function peg$parse_4hashStacheOpen() {
        var s0, s1;

        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c191) {
          s0 = peg$c191;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c192); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c190); }
        }

        return s0;
      }

      function peg$parse_4hashStacheClose() {
        var s0, s1;

        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 125) {
          s0 = peg$c180;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c181); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c193); }
        }

        return s0;
      }

      function peg$parse_4equalSign() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c194) {
          s1 = peg$c194;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c195); }
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 32) {
            s2 = peg$c36;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c37); }
          }
          if (s2 === peg$FAILED) {
            s2 = peg$c26;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c196();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 61) {
            s1 = peg$c40;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c41); }
          }
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 32) {
              s2 = peg$c36;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c37); }
            }
            if (s2 === peg$FAILED) {
              s2 = peg$c26;
            }
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c197();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        }

        return s0;
      }

      function peg$parse_4htmlStart() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$parse_4htmlTagName();
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4shorthandAttributes();
          if (s2 === peg$FAILED) {
            s2 = peg$c26;
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 47) {
              s3 = peg$c20;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c21); }
            }
            if (s3 === peg$FAILED) {
              s3 = peg$c26;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = peg$currPos;
              s4 = peg$c198(s1, s2);
              if (s4) {
                s4 = peg$c14;
              } else {
                s4 = peg$c8;
              }
              if (s4 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4inHtmlTag() {
        var s0, s1, s2, s3, s4, s5, s6;

        s0 = peg$currPos;
        s1 = peg$parse_4htmlStart();
        if (s1 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c199) {
            s2 = peg$c199;
            peg$currPos += 2;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c200); }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_4TERM();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parse_4TERM();
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parse_4inTagMustache();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parse_4inTagMustache();
              }
              if (s4 !== peg$FAILED) {
                s5 = [];
                s6 = peg$parse_4bracketedAttribute();
                if (s6 !== peg$FAILED) {
                  while (s6 !== peg$FAILED) {
                    s5.push(s6);
                    s6 = peg$parse_4bracketedAttribute();
                  }
                } else {
                  s5 = peg$c8;
                }
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c201(s1, s4, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse_4htmlStart();
          if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parse_4inTagMustache();
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              s3 = peg$parse_4inTagMustache();
            }
            if (s2 !== peg$FAILED) {
              s3 = [];
              s4 = peg$parse_4fullAttribute();
              while (s4 !== peg$FAILED) {
                s3.push(s4);
                s4 = peg$parse_4fullAttribute();
              }
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c201(s1, s2, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        }

        return s0;
      }

      function peg$parse_4shorthandAttributes() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$currPos;
        s3 = peg$parse_4idShorthand();
        if (s3 !== peg$FAILED) {
          peg$reportedPos = s2;
          s3 = peg$c202(s3);
        }
        s2 = s3;
        if (s2 === peg$FAILED) {
          s2 = peg$currPos;
          s3 = peg$parse_4classShorthand();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s2;
            s3 = peg$c203(s3);
          }
          s2 = s3;
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$currPos;
            s3 = peg$parse_4idShorthand();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s2;
              s3 = peg$c202(s3);
            }
            s2 = s3;
            if (s2 === peg$FAILED) {
              s2 = peg$currPos;
              s3 = peg$parse_4classShorthand();
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s2;
                s3 = peg$c203(s3);
              }
              s2 = s3;
            }
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c204(s1);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4fullAttribute() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        if (input.charCodeAt(peg$currPos) === 32) {
          s2 = peg$c36;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (input.charCodeAt(peg$currPos) === 32) {
              s2 = peg$c36;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c37); }
            }
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4actionAttribute();
          if (s2 === peg$FAILED) {
            s2 = peg$parse_4booleanAttribute();
            if (s2 === peg$FAILED) {
              s2 = peg$parse_4boundAttributeWithSingleMustache();
              if (s2 === peg$FAILED) {
                s2 = peg$parse_4boundAttribute();
                if (s2 === peg$FAILED) {
                  s2 = peg$parse_4rawMustacheAttribute();
                  if (s2 === peg$FAILED) {
                    s2 = peg$parse_4normalAttribute();
                  }
                }
              }
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c205(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4bracketedAttribute() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4INDENT();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_4INDENT();
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          if (input.charCodeAt(peg$currPos) === 32) {
            s3 = peg$c36;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c37); }
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (input.charCodeAt(peg$currPos) === 32) {
              s3 = peg$c36;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c37); }
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4actionAttribute();
            if (s3 === peg$FAILED) {
              s3 = peg$parse_4booleanAttribute();
              if (s3 === peg$FAILED) {
                s3 = peg$parse_4boundAttribute();
                if (s3 === peg$FAILED) {
                  s3 = peg$parse_4rawMustacheAttribute();
                  if (s3 === peg$FAILED) {
                    s3 = peg$parse_4normalAttribute();
                  }
                }
              }
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parse_4TERM();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parse_4TERM();
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c206(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4boundAttributeValueChar() {
        var s0;

        if (peg$c207.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c208); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4nonSeparatorColon();
        }

        return s0;
      }

      function peg$parse_4actionValue() {
        var s0, s1;

        s0 = peg$parse_4stringWithQuotes();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse_4pathIdNode();
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c209(s1);
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parse_4actionAttribute() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parse_4knownEvent();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c40;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c41); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4actionValue();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c210(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4booleanAttribute() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parse_4key();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c40;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c41); }
          }
          if (s2 !== peg$FAILED) {
            if (input.substr(peg$currPos, 4) === peg$c141) {
              s3 = peg$c141;
              peg$currPos += 4;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c142); }
            }
            if (s3 === peg$FAILED) {
              if (input.substr(peg$currPos, 5) === peg$c143) {
                s3 = peg$c143;
                peg$currPos += 5;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c144); }
              }
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c211(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4boundAttributeValue() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
          s1 = peg$c164;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c165); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4_();
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            s4 = [];
            s5 = peg$parse_4boundAttributeValueChar();
            if (s5 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 32) {
                s5 = peg$c36;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c37); }
              }
            }
            if (s5 !== peg$FAILED) {
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parse_4boundAttributeValueChar();
                if (s5 === peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 32) {
                    s5 = peg$c36;
                    peg$currPos++;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c37); }
                  }
                }
              }
            } else {
              s4 = peg$c8;
            }
            if (s4 !== peg$FAILED) {
              s4 = input.substring(s3, peg$currPos);
            }
            s3 = s4;
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_4_();
              if (s4 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 125) {
                  s5 = peg$c180;
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c181); }
                }
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c212(s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = [];
          s2 = peg$parse_4boundAttributeValueChar();
          if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
              s1.push(s2);
              s2 = peg$parse_4boundAttributeValueChar();
            }
          } else {
            s1 = peg$c8;
          }
          if (s1 !== peg$FAILED) {
            s1 = input.substring(s0, peg$currPos);
          }
          s0 = s1;
        }

        return s0;
      }

      function peg$parse_4allCharactersExceptColonSyntax() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4nmchar();
        if (s2 === peg$FAILED) {
          if (peg$c213.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c214); }
          }
          if (s2 === peg$FAILED) {
            s2 = peg$parse_4whitespace();
            if (s2 === peg$FAILED) {
              s2 = peg$parse_4singleQuoteString();
              if (s2 === peg$FAILED) {
                s2 = peg$parse_4doubleQuoteString();
              }
            }
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_4nmchar();
          if (s2 === peg$FAILED) {
            if (peg$c213.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c214); }
            }
            if (s2 === peg$FAILED) {
              s2 = peg$parse_4whitespace();
              if (s2 === peg$FAILED) {
                s2 = peg$parse_4singleQuoteString();
                if (s2 === peg$FAILED) {
                  s2 = peg$parse_4doubleQuoteString();
                }
              }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4nonQuoteChars() {
        var s0;

        if (peg$c215.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c216); }
        }

        return s0;
      }

      function peg$parse_4singleQuoteString() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (peg$c217.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c218); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parse_4nonQuoteChars();
          if (s4 === peg$FAILED) {
            if (peg$c219.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c220); }
            }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parse_4nonQuoteChars();
            if (s4 === peg$FAILED) {
              if (peg$c219.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c220); }
              }
            }
          }
          if (s3 !== peg$FAILED) {
            if (peg$c217.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c218); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4doubleQuoteString() {
        var s0, s1, s2, s3, s4;

        s0 = peg$currPos;
        s1 = peg$currPos;
        if (peg$c219.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c220); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parse_4nonQuoteChars();
          if (s4 === peg$FAILED) {
            if (peg$c217.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c218); }
            }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parse_4nonQuoteChars();
            if (s4 === peg$FAILED) {
              if (peg$c217.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c218); }
              }
            }
          }
          if (s3 !== peg$FAILED) {
            if (peg$c219.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c220); }
            }
            if (s4 !== peg$FAILED) {
              s2 = [s2, s3, s4];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c8;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c8;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4boundAttributeWithSingleMustache() {
        var s0, s1, s2, s3, s4, s5, s6, s7;

        s0 = peg$currPos;
        s1 = peg$parse_4key();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c40;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c41); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4singleOpen();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_4_();
              if (s4 !== peg$FAILED) {
                s5 = peg$parse_4allCharactersExceptColonSyntax();
                if (s5 !== peg$FAILED) {
                  s6 = peg$parse_4_();
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parse_4singleClose();
                    if (s7 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c221(s1, s5);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c8;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c8;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c8;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4boundAttribute() {
        var s0, s1, s2, s3, s4, s5;

        s0 = peg$currPos;
        s1 = peg$parse_4key();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c40;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c41); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4boundAttributeValue();
            if (s3 !== peg$FAILED) {
              s4 = peg$currPos;
              peg$silentFails++;
              if (input.charCodeAt(peg$currPos) === 33) {
                s5 = peg$c71;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c72); }
              }
              peg$silentFails--;
              if (s5 === peg$FAILED) {
                s4 = peg$c14;
              } else {
                peg$currPos = s4;
                s4 = peg$c8;
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c222(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4rawMustacheAttribute() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parse_4key();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c40;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c41); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4pathIdNode();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c223(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4normalAttribute() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        s1 = peg$parse_4key();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 61) {
            s2 = peg$c40;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c41); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4attributeTextNodes();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c224(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4attributeName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4attributeChar();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_4attributeChar();
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4attributeChar() {
        var s0;

        s0 = peg$parse_4alpha();
        if (s0 === peg$FAILED) {
          if (peg$c69.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c70); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 95) {
              s0 = peg$c225;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c226); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 45) {
                s0 = peg$c4;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c5); }
              }
            }
          }
        }

        return s0;
      }

      function peg$parse_4tagNameShorthand() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 37) {
          s1 = peg$c59;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c60); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4cssIdentifier();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c93(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4idShorthand() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 35) {
          s1 = peg$c62;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c63); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4cssIdentifier();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c227(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4classShorthand() {
        var s0, s1, s2;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c6;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c7); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4cssIdentifier();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c93(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4cssIdentifier() {
        var s0, s1;

        peg$silentFails++;
        s0 = peg$parse_4ident();
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c228); }
        }

        return s0;
      }

      function peg$parse_4ident() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4nmchar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_4nmchar();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4nmchar() {
        var s0;

        if (peg$c229.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c230); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4nonascii();
        }

        return s0;
      }

      function peg$parse_4nmstart() {
        var s0;

        if (peg$c231.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c232); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4nonascii();
        }

        return s0;
      }

      function peg$parse_4nonascii() {
        var s0;

        if (peg$c233.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c234); }
        }

        return s0;
      }

      function peg$parse_4tagString() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4tagChar();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_4tagChar();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }

      function peg$parse_4htmlTagName() {
        var s0, s1, s2, s3;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 37) {
          s1 = peg$c59;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c60); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_4tagString();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c124(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4knownTagName();
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c235); }
        }

        return s0;
      }

      function peg$parse_4knownTagName() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$parse_4tagString();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c236(s1);
          if (s2) {
            s2 = peg$c14;
          } else {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c237(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4tagChar() {
        var s0;

        if (peg$c229.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c230); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4nonSeparatorColon();
        }

        return s0;
      }

      function peg$parse_4nonSeparatorColon() {
        var s0, s1, s2, s3;

        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 58) {
          s1 = peg$c129;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c130); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          peg$silentFails++;
          if (input.charCodeAt(peg$currPos) === 32) {
            s3 = peg$c36;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c37); }
          }
          peg$silentFails--;
          if (s3 === peg$FAILED) {
            s2 = peg$c14;
          } else {
            peg$currPos = s2;
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c93(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4knownEvent() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$parse_4tagString();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c239(s1);
          if (s2) {
            s2 = peg$c14;
          } else {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c237(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c238); }
        }

        return s0;
      }

      function peg$parse_4indentation() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$parse_4INDENT();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_4__();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c124(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4INDENT() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.length > peg$currPos) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c45(s1);
          if (s2) {
            s2 = peg$c14;
          } else {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c46(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c240); }
        }

        return s0;
      }

      function peg$parse_4DEDENT() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.length > peg$currPos) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c48(s1);
          if (s2) {
            s2 = peg$c14;
          } else {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c46(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c241); }
        }

        return s0;
      }

      function peg$parse_4UNMATCHED_DEDENT() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.length > peg$currPos) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = peg$currPos;
          s2 = peg$c243(s1);
          if (s2) {
            s2 = peg$c14;
          } else {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c46(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c242); }
        }

        return s0;
      }

      function peg$parse_4TERM() {
        var s0, s1, s2, s3, s4;

        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 13) {
          s1 = peg$c50;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c51); }
        }
        if (s1 === peg$FAILED) {
          s1 = peg$c26;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c44); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = peg$currPos;
            s3 = peg$c52(s2);
            if (s3) {
              s3 = peg$c14;
            } else {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 10) {
                s4 = peg$c53;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c54); }
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c55(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c8;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c8;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c244); }
        }

        return s0;
      }

      function peg$parse_4anyDedent() {
        var s0, s1;

        peg$silentFails++;
        s0 = peg$parse_4DEDENT();
        if (s0 === peg$FAILED) {
          s0 = peg$parse_4UNMATCHED_DEDENT();
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c245); }
        }

        return s0;
      }

      function peg$parse_4__() {
        var s0, s1, s2;

        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4whitespace();
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parse_4whitespace();
          }
        } else {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c246); }
        }

        return s0;
      }

      function peg$parse_4_() {
        var s0, s1;

        peg$silentFails++;
        s0 = [];
        s1 = peg$parse_4whitespace();
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = peg$parse_4whitespace();
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c247); }
        }

        return s0;
      }

      function peg$parse_4whitespace() {
        var s0, s1;

        peg$silentFails++;
        if (peg$c249.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c250); }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c248); }
        }

        return s0;
      }

      function peg$parse_4lineChar() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = peg$currPos;
        peg$silentFails++;
        s2 = peg$parse_4INDENT();
        if (s2 === peg$FAILED) {
          s2 = peg$parse_4DEDENT();
          if (s2 === peg$FAILED) {
            s2 = peg$parse_4TERM();
          }
        }
        peg$silentFails--;
        if (s2 === peg$FAILED) {
          s1 = peg$c14;
        } else {
          peg$currPos = s1;
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c44); }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c93(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c8;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c8;
        }

        return s0;
      }

      function peg$parse_4lineContent() {
        var s0, s1, s2;

        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_4lineChar();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parse_4lineChar();
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;

        return s0;
      }


        var builder = options.builder;

        var UNBOUND_MODIFIER = '!';
        var CONDITIONAL_MODIFIER = '?';

        var LINE_SPACE_MODIFIERS = {
          NEWLINE: '`',
          SPACE: "'"
        };

        var KNOWN_TAGS = {
          figcaption: true, blockquote: true, plaintext: true, textarea: true, progress: true,
          optgroup: true, noscript: true, noframes: true, frameset: true, fieldset: true,
          datalist: true, colgroup: true, basefont: true, summary: true, section: true,
          marquee: true, listing: true, isindex: true, details: true, command: true,
          caption: true, bgsound: true, article: true, address: true, acronym: true,
          strong: true, strike: true, spacer: true, source: true, select: true,
          script: true, output: true, option: true, object: true, legend: true,
          keygen: true, iframe: true, hgroup: true, header: true, footer: true,
          figure: true, center: true, canvas: true, button: true, applet: true, video: true,
          track: true, title: true, thead: true, tfoot: true, tbody: true, table: true,
          style: true, small: true, param: true, meter: true, label: true, input: true,
          frame: true, embed: true, blink: true, audio: true, aside: true, time: true,
          span: true, samp: true, ruby: true, nobr: true, meta: true, menu: true,
          mark: true, main: true, link: true, html: true, head: true, form: true,
          font: true, data: true, code: true, cite: true, body: true, base: true,
          area: true, abbr: true, xmp: true, wbr: true, 'var': true, sup: true,
          sub: true, pre: true, nav: true, map: true, kbd: true, ins: true,
          img: true, div: true, dir: true, dfn: true, del: true, col: true,
          big: true, bdo: true, bdi: true, ul: true, tt: true, tr: true, th: true, td: true,
          rt: true, rp: true, ol: true, li: true, hr: true, h6: true, h5: true, h4: true,
          h3: true, h2: true, h1: true, em: true, dt: true, dl: true, dd: true, br: true,
          u: true, s: true, q: true, p: true, i: true, b: true, a: true
        };

        var KNOWN_EVENTS = {
          "touchStart": true, "touchMove": true, "touchEnd": true, "touchCancel": true,
          "keyDown": true, "keyUp": true, "keyPress": true, "mouseDown": true, "mouseUp": true,
          "contextMenu": true, "click": true, "doubleClick": true, "mouseMove": true,
          "focusIn": true, "focusOut": true, "mouseEnter": true, "mouseLeave": true,
          "submit": true, "input": true, "change": true, "dragStart": true,
          "drag": true, "dragEnter": true, "dragLeave": true,
          "dragOver": true, "drop": true, "dragEnd": true
        };

        function prepareMustachValue(content){
          var parts = content.split(' '),
              first,
              match;

          // check for '!' unbound helper
          first = parts.shift();
          if (match = first.match(/(.*)!$/)) {
            parts.unshift( match[1] );
            content = 'unbound ' + parts.join(' ');
          } else {
            parts.unshift(first);
          }

          // check for '?' if helper
          first = parts.shift();
          if (match = first.match(/(.*)\?$/)) {
            parts.unshift( match[1] );
            content = 'if ' + parts.join(' ');
          } else {
            parts.unshift(first);
          }
          return content;
        }

        function castToAst(nodeOrString) {
          if (typeof nodeOrString === 'string') {
            return builder.generateText(nodeOrString);
          } else {
            return nodeOrString;
          }
        }

        function castStringsToTextNodes(possibleStrings) {
          var ret = [];
          var nodes = [];

          var currentString = null;
          var possibleString;

          for(var i=0, l=possibleStrings.length; i<l; i++) {
            possibleString = possibleStrings[i];
            if (typeof possibleString === 'string') {
              currentString = (currentString || '') + possibleString;
            } else {
              if (currentString) {
                ret.push( textNode(currentString) );
                currentString = null;
              }
              ret.push( possibleString ); // not a string, it is a node here
            }
          }
          if (currentString) {
            ret.push( textNode(currentString) );
          }
          return ret;
        }

        // attrs are simple strings,
        // combine all the ones that start with 'class='
        function coalesceAttrs(attrs){
          var classes = [];
          var newAttrs = [];
          var classRegex = /^class="(.*)"$/;
          var match;

          for (var i=0,l=attrs.length; i<l; i++) {
            var attr = attrs[i];
            if (match = attr.match(classRegex)) {
              classes.push(match[1]);
            } else {
              newAttrs.push(attr);
            }
          }

          if (classes.length) {
            newAttrs.push('class="' + classes.join(' ') + '"');
          }
          return newAttrs;
        }

        function createBlockOrMustache(mustacheTuple) {
          var mustache   = mustacheTuple[0];
          var blockTuple = mustacheTuple[1];

          var escaped    = mustache.isEscaped;
          var mustacheContent = mustache.name;
          var mustacheAttrs = mustache.attrs;
          var mustacheBlockParams = mustache.blockParams;

          if (mustacheAttrs.length) {
            var attrs = coalesceAttrs(mustacheAttrs);
            mustacheContent += ' ' + attrs.join(' ');
          }

          if (mustacheBlockParams) {
            mustacheContent += ' as |' + mustacheBlockParams.join(' ') + '|';
          }

          if (mustache.isViewHelper) {
            mustacheContent = 'view ' + mustacheContent;
          }

          if (mustache.modifier === UNBOUND_MODIFIER) {
            mustacheContent = 'unbound ' + mustacheContent;
          } else if (mustache.modifier === CONDITIONAL_MODIFIER) {
            mustacheContent = 'if ' + mustacheContent;
          }

          if (blockTuple && blockTuple.length > 0) {
            var block = builder.generateBlock(mustacheContent, escaped);
            builder.enter(block);
            builder.add('childNodes', blockTuple[0]);

            if (blockTuple[1]) {
              builder.add('invertibleNodes', blockTuple[1]);
            }
            return builder.exit();
          } else {
            return builder.generateMustache(mustacheContent, escaped);
          }
        }

        function flattenArray(first, tail) {
          var ret = [];
          if(first) {
            ret.push(first);
          }
          for(var i = 0; i < tail.length; ++i) {
            var t = tail[i];
            ret.push(t[0]);
            if(t[1]) {
              ret.push(t[1]);
            }
          }
          return ret;
        }

        function textNode(content){
          return builder.generateText(content);
        }

        /**
          Splits a value string into separate parts,
          then generates a classBinding for each part.
        */
        function splitValueIntoClassBindings(value) {
          return value.split(' ').map(function(v){
            return builder.generateClassNameBinding(v);
          });
        }

        function parseInHtml(h, inTagMustaches, fullAttributes) {
          var tagName = h[0] || 'div',
              shorthandAttributes = h[1] || [],
              id = shorthandAttributes[0],
              classes = shorthandAttributes[1] || [];
          var i, l;

          var elementNode = builder.generateElement(tagName);
          builder.enter(elementNode);

          for (i=0, l=classes.length;i<l;i++) {
            if (classes[i].type === 'classNameBinding') {
              builder.add('classNameBindings', classes[i]);
            } else {
              builder.classNameBinding(':'+classes[i]);
            }
          }

          if (id) {
            builder.attribute('id', id);
          }

          for(i = 0; i < inTagMustaches.length; ++i) {
            builder.add('attrStaches', inTagMustaches[i]);
          }

          for(i = 0; i < fullAttributes.length; ++i) {
            var currentAttr = fullAttributes[i];

            if (Array.isArray(currentAttr) && typeof currentAttr[0] === 'string') {  // a "normalAttribute", [attrName, attrContent]
              if (currentAttr.length) { // a boolean false attribute will be []

                // skip classes now, coalesce them later
                if (currentAttr[0] === 'class') {
                  builder.classNameBinding(':'+currentAttr[1]);
                } else {
                  builder.attribute(currentAttr[0], currentAttr[1]);
                }
              }
            } else if (Array.isArray(currentAttr)) {
              currentAttr.forEach(function(attrNode){
                builder.add(
                  attrNode.type === 'classNameBinding' ? 'classNameBindings' : 'attrStaches',
                  attrNode
                );
              });
            } else {
              builder.add(
                currentAttr.type === 'classNameBinding' ? 'classNameBindings' : 'attrStaches',
                currentAttr
              );
            }
          }
        }



      peg$result = peg$startRuleFunction();

      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail({ type: "end", description: "end of input" });
        }

        throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
      }
    }

    return {
      SyntaxError: SyntaxError,
      parse:       parse
    };
  })();
  var parse = Parser.parse, ParserSyntaxError = Parser.SyntaxError;
  exports['default'] = parse;

  exports.ParserSyntaxError = ParserSyntaxError;
  exports.parse = parse;

});
define('emblem/preprocessor', ['exports', 'string-scanner'], function (exports, StringScanner) {

  'use strict';

  exports.processSync = processSync;
  exports.prettyPrint = prettyPrint;

  var anyWhitespaceAndNewlinesTouchingEOF, any_whitespaceFollowedByNewlines_, processInput, ws;

  ws = "\\t\\x0B\\f \\xA0\\u1680\\u180E\\u2000-\\u200A\\u202F\\u205F\\u3000\\uFEFF";

  var INDENT_SYMBOL = "";
  var DEDENT_SYMBOL = "";
  var UNMATCHED_DEDENT_SYMBOL = "";
  var TERM_SYMBOL = "";

  // Prints an easy-to-read version of the preprocessed string for
  // debugging
  function prettyPrint(string) {
    var indent = new RegExp(INDENT_SYMBOL, "g");
    var dedent = new RegExp(DEDENT_SYMBOL, "g");
    var term = new RegExp(TERM_SYMBOL, "g");
    var unmatchedDedent = new RegExp(UNMATCHED_DEDENT_SYMBOL, "g");
    var newLine = new RegExp("\n", "g");
    var carriageReturn = new RegExp("\r", "g");

    return string.replace(indent, "{INDENT}").replace(dedent, "{DEDENT}").replace(term, "{TERM}").replace(unmatchedDedent, "{UNMATCHED_DEDENT}").replace(newLine, "{\\n}").replace(carriageReturn, "{\\r}");
  }

  anyWhitespaceAndNewlinesTouchingEOF = new RegExp("[" + ws + "\\r?\\n]*$");

  any_whitespaceFollowedByNewlines_ = new RegExp("(?:[" + ws + "]*\\r?\\n)+");

  function Preprocessor() {
    this.base = null;
    this.indents = [];
    this.context = [];
    this.ss = new StringScanner['default']("");
    this.context.peek = function () {
      if (this.length) {
        return this[this.length - 1];
      } else {
        return null;
      }
    };
    this.context.err = function (c) {
      throw new Error("Unexpected " + c);
    };
    this.output = "";
    this.context.observe = function (c) {
      var top;
      top = this.peek();
      switch (c) {
        case INDENT_SYMBOL:
          this.push(c);
          break;
        case DEDENT_SYMBOL:
          if (top !== INDENT_SYMBOL) {
            this.err(c);
          }
          this.pop();
          break;
        case "\r":
          if (top !== "/") {
            this.err(c);
          }
          this.pop();
          break;
        case "\n":
          if (top !== "/") {
            this.err(c);
          }
          this.pop();
          break;
        case "/":
          this.push(c);
          break;
        case "end-\\":
          if (top !== "\\") {
            this.err(c);
          }
          this.pop();
          break;
        default:
          throw new Error("undefined token observed: " + c);
      }
      return this;
    };
  }

  Preprocessor.prototype.p = function (s) {
    if (s) {
      this.output += s;
    }
    return s;
  };

  Preprocessor.prototype.scan = function (r) {
    return this.p(this.ss.scan(r));
  };

  Preprocessor.prototype.discard = function (r) {
    return this.ss.scan(r);
  };

  processInput = function (isEnd) {
    return function (data) {
      var b, d, indent, s;
      if (!isEnd) {
        this.ss.concat(data);
        this.discard(any_whitespaceFollowedByNewlines_);
      }
      while (!this.ss.eos()) {
        switch (this.context.peek()) {
          case null:
          case INDENT_SYMBOL:
            if (this.ss.bol() || this.discard(any_whitespaceFollowedByNewlines_)) {
              if (this.discard(new RegExp("[" + ws + "]*\\r?\\n"))) {
                this.p("" + TERM_SYMBOL + "\n");
                continue;
              }
              if (this.base != null) {
                if (this.discard(this.base) == null) {
                  throw new Error("inconsistent base indentation");
                }
              } else {
                b = this.discard(new RegExp("[" + ws + "]*"));
                this.base = new RegExp("" + b);
              }
              if (this.indents.length === 0) {
                if (this.ss.check(new RegExp("[" + ws + "]+"))) {
                  this.p(INDENT_SYMBOL);
                  this.context.observe(INDENT_SYMBOL);
                  this.indents.push(this.scan(new RegExp("([" + ws + "]+)")));
                }
              } else {
                indent = this.indents[this.indents.length - 1];
                if (d = this.ss.check(new RegExp("(" + indent + ")"))) {
                  this.discard(d);
                  if (this.ss.check(new RegExp("([" + ws + "]+)"))) {
                    this.p(INDENT_SYMBOL);
                    this.context.observe(INDENT_SYMBOL);
                    this.indents.push(d + this.scan(new RegExp("([" + ws + "]+)")));
                  }
                } else {
                  while (this.indents.length) {
                    indent = this.indents[this.indents.length - 1];
                    if (this.discard(new RegExp("(?:" + indent + ")"))) {
                      break;
                    }
                    this.context.observe(DEDENT_SYMBOL);
                    this.p(DEDENT_SYMBOL);
                    this.indents.pop();
                  }
                  if (s = this.discard(new RegExp("[" + ws + "]+"))) {
                    this.output = this.output.slice(0, -1);
                    this.output += UNMATCHED_DEDENT_SYMBOL;
                    this.p(INDENT_SYMBOL);
                    this.context.observe(INDENT_SYMBOL);
                    this.indents.push(s);
                  }
                }
              }
            }
            this.scan(/[^\r\n]+/);
            if (this.discard(/\r?\n/)) {
              this.p("" + TERM_SYMBOL + "\n");
            }
        }
      }
      if (isEnd) {
        this.scan(anyWhitespaceAndNewlinesTouchingEOF);
        while (this.context.length && INDENT_SYMBOL === this.context.peek()) {
          this.context.observe(DEDENT_SYMBOL);
          this.p(DEDENT_SYMBOL);
        }
        if (this.context.length) {
          throw new Error("Unclosed " + this.context.peek() + " at EOF");
        }
      }
    };
  };

  Preprocessor.prototype.processData = processInput(false);

  Preprocessor.prototype.processEnd = processInput(true);function processSync(input) {
    var pre;
    input += "\n";
    pre = new Preprocessor();
    pre.processData(input);
    pre.processEnd();
    return pre.output;
  }exports['default'] = Preprocessor;

  exports.INDENT_SYMBOL = INDENT_SYMBOL;
  exports.DEDENT_SYMBOL = DEDENT_SYMBOL;
  exports.UNMATCHED_DEDENT_SYMBOL = UNMATCHED_DEDENT_SYMBOL;
  exports.TERM_SYMBOL = TERM_SYMBOL;

});
define('emblem/process-opcodes', ['exports'], function (exports) {

  'use strict';

  exports.processOpcodes = processOpcodes;

  function processOpcodes(compiler, opcodes) {
    for (var i = 0, l = opcodes.length; i < l; i++) {
      var method = opcodes[i][0];
      var params = opcodes[i][1];
      if (params) {
        compiler[method].apply(compiler, params);
      } else {
        compiler[method].call(compiler);
      }
    }
  }

});
define('emblem/quoting', ['exports'], function (exports) {

  'use strict';

  exports.repeat = repeat;
  exports.escapeString = escapeString;
  exports.string = string;

  function escapeString(str) {
    str = str.replace(/\\/g, "\\\\");
    str = str.replace(/"/g, "\\\"");
    str = str.replace(/\n/g, "\\n");
    return str;
  }

  function string(str) {
    return "\"" + escapeString(str) + "\"";
  }

  function repeat(chars, times) {
    var str = "";
    while (times--) {
      str += chars;
    }
    return str;
  }

});
define('emblem/template-compiler', ['exports', 'emblem/process-opcodes', 'emblem/template-visitor', 'emblem/quoting'], function (exports, process_opcodes, template_visitor, quoting) {

  'use strict';

  exports.compile = compile;

  function compile(ast) {
    var opcodes = [];
    template_visitor.visit(ast, opcodes);
    reset(compiler);
    process_opcodes.processOpcodes(compiler, opcodes);
    return flush(compiler);
  }function reset(compiler) {
    compiler._content = [];
  }

  function flush(compiler) {
    return compiler._content.join("");
  }

  function pushContent(compiler, content) {
    compiler._content.push(content);
  }

  /**
    Wrap an string in mustache
    @param {Array} names
    @return {Array}
  */
  function wrapMustacheStrings(names) {
    return names.map(function (name) {
      return "{{" + name + "}}";
    });
  }

  /**
    Map a colon syntax string to inline if syntax.
    @param {String} Name
    @return {String}
  */
  function mapColonSyntax(name) {
    var parts = name.split(":");

    // First item will always be wrapped in single quotes (since we need at least one result for condition)
    parts[1] = singleQuoteString(parts[1]);

    // Only wrap second option if it exists
    if (parts[2]) parts[2] = singleQuoteString(parts[2]);

    parts.unshift("if");

    return parts.join(" ");
  }

  /**
    Wrap an string in single quotes
    @param {String} value
    @return {String}
  */
  function singleQuoteString(value) {
    return "'" + value + "'";
  }

  var boundClassNames, unboundClassNames;

  var compiler = {
    startProgram: function () {},
    endProgram: function () {},

    text: function (content) {
      pushContent(this, content);
    },

    attribute: function (name, content) {
      var attrString = " " + name;
      if (content === undefined) {} else {
        attrString += "=" + quoting.string(content);
      }
      pushContent(this, attrString);
    },

    openElementStart: function (tagName) {
      this._insideElement = true;
      pushContent(this, "<" + tagName);
    },

    openElementEnd: function () {
      pushContent(this, ">");
      this._insideElement = false;
    },

    closeElement: function (tagName) {
      pushContent(this, "</" + tagName + ">");
    },

    openClassNameBindings: function () {
      boundClassNames = [];
      unboundClassNames = [];
    },

    /**
      Add a class name binding
      @param {String} name
    */
    classNameBinding: function (name) {
      var isBoundAttribute = name[0] !== ":";

      if (isBoundAttribute) {
        var isColonSyntax = name.indexOf(":") > -1;
        if (isColonSyntax) {
          name = mapColonSyntax(name);
        }
        boundClassNames.push(name);
      } else {
        name = name.slice(1);
        unboundClassNames.push(name);
      }
    },

    /**
      Group all unbound classes into a single string
      Wrap each binding in mustache
    */
    closeClassNameBindings: function () {
      var unboundClassString = unboundClassNames.join(" ");
      var mustacheString = wrapMustacheStrings(boundClassNames).join(" ");
      var results = [unboundClassString, mustacheString];

      // Remove any blank strings
      results = results.filter(function (i) {
        return i !== "";
      });
      results = results.join(" ");

      // We only need to wrap the results in quotes if we have at least one unbound or more than 1 bound attributes
      var wrapInString = unboundClassString.length > 0 || boundClassNames.length > 1;

      if (wrapInString) results = quoting.string(results);else if (results.length === 0) results = "\"\"";

      pushContent(this, " class=" + results);
    },

    startBlock: function (content) {
      pushContent(this, "{{#" + content + "}}");
    },

    endBlock: function (content) {
      var parts = content.split(" ");

      pushContent(this, "{{/" + parts[0] + "}}");
    },

    mustache: function (content, escaped) {
      var prepend = this._insideElement ? " " : "";
      if (escaped) {
        pushContent(this, prepend + "{{" + content + "}}");
      } else {
        pushContent(this, prepend + "{{{" + content + "}}}");
      }
    },

    /**
      Special syntax for assigning mustache to a key
      @param {String} content
      @param {String} key
    */
    assignedMustache: function (content, key) {
      var prepend = this._insideElement ? " " : "";
      pushContent(this, prepend + key + "=" + "{{" + content + "}}");
    }
  };
  // boolean attribute with a true value, this is a no-op

});
define('emblem/template-visitor', ['exports'], function (exports) {

  'use strict';

  exports.visit = visit;

  /**
    Visit a single node
    @oaram {Object} node
    @param {Array} opcodes
  */
  function visit(node, opcodes) {
    visitor[node.type](node, opcodes);
  } /**
      Visit a series of nodes
      @oaram {Array} nodes
      @param {Array} opcodes
    */
  function visitArray(nodes, opcodes) {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (var i = 0, l = nodes.length; i < l; i++) {
      // Due to the structure of invertible nodes, it is possible to receive an array of arrays
      if (nodes[i] instanceof Array) visitArray(nodes[i], opcodes);else visit(nodes[i], opcodes);
    }
  }

  /**
    Process an invertible object
    @param {Object} node
    @param {Array} opcodes
  */
  function addInvertible(node, opcodes) {
    opcodes.push(["mustache", [node.name.trim(), true]]);

    // The content helper always returns an array
    visitArray(node.content, opcodes);

    // Recursion if this node has more invertible nodes
    if (node.invertibleNodes) addInvertible(node.invertibleNodes, opcodes);
  }

  var visitor = {

    program: function (node, opcodes) {
      opcodes.push(["startProgram"]);
      visitArray(node.childNodes, opcodes);
      opcodes.push(["endProgram"]);
    },

    text: function (node, opcodes) {
      opcodes.push(["text", [node.content]]);
    },

    attribute: function (node, opcodes) {
      opcodes.push(["attribute", [node.name, node.content]]);
    },

    classNameBinding: function (node, opcodes) {
      opcodes.push(["classNameBinding", [node.name]]);
    },

    element: function (node, opcodes) {
      opcodes.push(["openElementStart", [node.tagName]]);
      visitArray(node.attrStaches, opcodes);
      if (node.classNameBindings && node.classNameBindings.length) {
        opcodes.push(["openClassNameBindings"]);
        visitArray(node.classNameBindings, opcodes);
        opcodes.push(["closeClassNameBindings"]);
      }
      opcodes.push(["openElementEnd"]);

      if (node.isVoid) {
        if (node.childNodes.length) {
          throw new Error("Cannot nest under void element " + node.tagName);
        }
      } else {
        visitArray(node.childNodes, opcodes);
        opcodes.push(["closeElement", [node.tagName]]);
      }
    },

    block: function (node, opcodes) {
      opcodes.push(["startBlock", [node.content]]);
      visitArray(node.childNodes, opcodes);

      // The root block node will have an array of invertibleNodes, but there can only ever be one
      if (node.invertibleNodes && node.invertibleNodes.length > 0) {
        addInvertible(node.invertibleNodes[0], opcodes);
      }

      opcodes.push(["endBlock", [node.content]]);
    },

    mustache: function (node, opcodes) {
      opcodes.push(["mustache", [node.content, node.escaped]]);
    },

    assignedMustache: function (node, opcodes) {
      opcodes.push(["assignedMustache", [node.content, node.key]]);
    }
  };

});
define('emblem/utils/void-elements', ['exports'], function (exports) {

  'use strict';

  // http://www.w3.org/TR/html-markup/syntax.html#syntax-elements
  var voidElementTags = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];

  function isVoidElement(tagName) {
    return voidElementTags.indexOf(tagName) > -1;
  }

  exports['default'] = isVoidElement;

});
define('string-scanner', ['exports'], function (exports) {

  'use strict';

  var module = {};

  (function() {
    var StringScanner;
    StringScanner = (function() {
      function StringScanner(str) {
        this.str = str != null ? str : '';
        this.str = '' + this.str;
        this.pos = 0;
        this.lastMatch = {
          reset: function() {
            this.str = null;
            this.captures = [];
            return this;
          }
        }.reset();
        this;
      }
      StringScanner.prototype.bol = function() {
        return this.pos <= 0 || (this.str[this.pos - 1] === "\n");
      };
      StringScanner.prototype.captures = function() {
        return this.lastMatch.captures;
      };
      StringScanner.prototype.check = function(pattern) {
        var matches;
        if (this.str.substr(this.pos).search(pattern) !== 0) {
          this.lastMatch.reset();
          return null;
        }
        matches = this.str.substr(this.pos).match(pattern);
        this.lastMatch.str = matches[0];
        this.lastMatch.captures = matches.slice(1);
        return this.lastMatch.str;
      };
      StringScanner.prototype.checkUntil = function(pattern) {
        var matches, patternPos;
        patternPos = this.str.substr(this.pos).search(pattern);
        if (patternPos < 0) {
          this.lastMatch.reset();
          return null;
        }
        matches = this.str.substr(this.pos + patternPos).match(pattern);
        this.lastMatch.captures = matches.slice(1);
        return this.lastMatch.str = this.str.substr(this.pos, patternPos) + matches[0];
      };
      StringScanner.prototype.clone = function() {
        var clone, prop, value, _ref;
        clone = new this.constructor(this.str);
        clone.pos = this.pos;
        clone.lastMatch = {};
        _ref = this.lastMatch;
        for (prop in _ref) {
          value = _ref[prop];
          clone.lastMatch[prop] = value;
        }
        return clone;
      };
      StringScanner.prototype.concat = function(str) {
        this.str += str;
        return this;
      };
      StringScanner.prototype.eos = function() {
        return this.pos === this.str.length;
      };
      StringScanner.prototype.exists = function(pattern) {
        var matches, patternPos;
        patternPos = this.str.substr(this.pos).search(pattern);
        if (patternPos < 0) {
          this.lastMatch.reset();
          return null;
        }
        matches = this.str.substr(this.pos + patternPos).match(pattern);
        this.lastMatch.str = matches[0];
        this.lastMatch.captures = matches.slice(1);
        return patternPos;
      };
      StringScanner.prototype.getch = function() {
        return this.scan(/./);
      };
      StringScanner.prototype.match = function() {
        return this.lastMatch.str;
      };
      StringScanner.prototype.matches = function(pattern) {
        this.check(pattern);
        return this.matchSize();
      };
      StringScanner.prototype.matched = function() {
        return this.lastMatch.str != null;
      };
      StringScanner.prototype.matchSize = function() {
        if (this.matched()) {
          return this.match().length;
        } else {
          return null;
        }
      };
      StringScanner.prototype.peek = function(len) {
        return this.str.substr(this.pos, len);
      };
      StringScanner.prototype.pointer = function() {
        return this.pos;
      };
      StringScanner.prototype.setPointer = function(pos) {
        pos = +pos;
        if (pos < 0) {
          pos = 0;
        }
        if (pos > this.str.length) {
          pos = this.str.length;
        }
        return this.pos = pos;
      };
      StringScanner.prototype.reset = function() {
        this.lastMatch.reset();
        this.pos = 0;
        return this;
      };
      StringScanner.prototype.rest = function() {
        return this.str.substr(this.pos);
      };
      StringScanner.prototype.scan = function(pattern) {
        var chk;
        chk = this.check(pattern);
        if (chk != null) {
          this.pos += chk.length;
        }
        return chk;
      };
      StringScanner.prototype.scanUntil = function(pattern) {
        var chk;
        chk = this.checkUntil(pattern);
        if (chk != null) {
          this.pos += chk.length;
        }
        return chk;
      };
      StringScanner.prototype.skip = function(pattern) {
        this.scan(pattern);
        return this.matchSize();
      };
      StringScanner.prototype.skipUntil = function(pattern) {
        this.scanUntil(pattern);
        return this.matchSize();
      };
      StringScanner.prototype.string = function() {
        return this.str;
      };
      StringScanner.prototype.terminate = function() {
        this.pos = this.str.length;
        this.lastMatch.reset();
        return this;
      };
      StringScanner.prototype.toString = function() {
        return "#<StringScanner " + (this.eos() ? 'fin' : "" + this.pos + "/" + this.str.length + " @ " + (this.str.length > 8 ? "" + (this.str.substr(0, 5)) + "..." : this.str)) + ">";
      };
      return StringScanner;
    })();
    StringScanner.prototype.beginningOfLine = StringScanner.prototype.bol;
    StringScanner.prototype.clear = StringScanner.prototype.terminate;
    StringScanner.prototype.dup = StringScanner.prototype.clone;
    StringScanner.prototype.endOfString = StringScanner.prototype.eos;
    StringScanner.prototype.exist = StringScanner.prototype.exists;
    StringScanner.prototype.getChar = StringScanner.prototype.getch;
    StringScanner.prototype.position = StringScanner.prototype.pointer;
    StringScanner.StringScanner = StringScanner;
    module.exports = StringScanner;
  }).call(undefined);

  exports['default'] = module.exports;

});