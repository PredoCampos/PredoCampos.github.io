// gif.worker.js 0.2.0 - https://github.com/jnordberg/gif.js
(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, l, l.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
})({
    1: [function(require, module, exports) {
        var NeuQuant = require("./TypedNeuQuant.js");
        var LZWEncoder = require("./LZWEncoder.js");

        function ByteArray() {
            this.page = -1;
            this.pages = [];
            this.newPage()
        }
        ByteArray.pageSize = 4096;
        ByteArray.charMap = {};
        for (var i = 0; i < 256; i++) ByteArray.charMap[i] = String.fromCharCode(i);
        ByteArray.prototype.newPage = function() {
            this.pages[++this.page] = new Uint8Array(ByteArray.pageSize);
            this.pos = 0
        };
        ByteArray.prototype.getData = function() {
            var v = "";
            for (var i = 0; i < this.pages.length; i++) {
                v += ByteArray.charMap[this.pages[i]]
            }
            return v
        };
        ByteArray.prototype.writeByte = function(val) {
            if (this.pos >= ByteArray.pageSize) this.newPage();
            this.pages[this.page][this.pos++] = val
        };
        ByteArray.prototype.writeUTFBytes = function(str) {
            for (var i = 0, l = str.length; i < l; i++) {
                this.writeByte(str.charCodeAt(i))
            }
        };
        ByteArray.prototype.writeBytes = function(array, offset, length) {
            for (var i = 0, l = length || array.length; i < l; i++) {
                this.writeByte(array[offset ? offset + i : i])
            }
        };

        function GIFEncoder(width, height) {
            this.width = ~~width;
            this.height = ~~height;
            this.transparent = null;
            this.transIndex = 0;
            this.repeat = -1;
            this.delay = 0;
            this.image = null;
            this.pixels = null;
            this.indexedPixels = null;
            this.colorDepth = null;
            this.colorTab = null;
            this.neuQuant = null;
            this.usedEntry = new Array;
            this.palSize = 7;
            this.dispose = -1;
            this.firstFrame = true;
            this.sample = 10;
            this.out = new ByteArray
        }
        GIFEncoder.prototype.setDelay = function(milliseconds) {
            this.delay = Math.round(milliseconds / 10)
        };
        GIFEncoder.prototype.setFrameRate = function(fps) {
            this.delay = Math.round(100 / fps)
        };
        GIFEncoder.prototype.setDispose = function(disposalCode) {
            if (disposalCode >= 0) this.dispose = disposalCode
        };
        GIFEncoder.prototype.setRepeat = function(repeat) {
            this.repeat = repeat
        };
        GIFEncoder.prototype.setTransparent = function(color) {
            this.transparent = color
        };
        GIFEncoder.prototype.addFrame = function(imageData) {
            this.image = imageData;
            this.pixels = imageData.data;
            this.getPixels();
            this.analyzePixels();
            if (this.firstFrame) {
                this.writeLSD();
                this.writePalette();
                if (this.repeat >= 0) {
                    this.writeNetscapeExt()
                }
            }
            this.writeGraphicCtrlExt();
            this.writeImageDesc();
            if (!this.firstFrame) this.writePalette();
            this.writePixels();
            this.firstFrame = false
        };
        GIFEncoder.prototype.finish = function() {
            this.out.writeByte(59)
        };
        GIFEncoder.prototype.setQuality = function(quality) {
            if (quality < 1) quality = 1;
            this.sample = quality
        };
        GIFEncoder.prototype.setProperties = function(has_alpha, is_first) {
            this.has_alpha = has_alpha;
            this.firstFrame = is_first
        };
        GIFEncoder.prototype.analyzePixels = function() {
            var len = this.pixels.length;
            var nPix = len / 3;
            this.indexedPixels = new Uint8Array(nPix);
            this.neuQuant = new NeuQuant(this.pixels, this.sample);
            this.colorTab = this.neuQuant.process();
            var k = 0;
            for (var j = 0; j < nPix; j++) {
                var index = this.neuQuant.map(this.pixels[k++] & 255, this.pixels[k++] & 255, this.pixels[k++] & 255);
                this.usedEntry[index] = true;
                this.indexedPixels[j] = index
            }
            this.pixels = null;
            this.colorDepth = 8;
            this.palSize = 7;
            if (this.transparent !== null) {
                this.transIndex = this.findClosest(this.transparent, true)
            }
        };
        GIFEncoder.prototype.findClosest = function(c, used) {
            if (this.colorTab === null) return -1;
            var r = (c & 16711680) >> 16;
            var g = (c & 65280) >> 8;
            var b = c & 255;
            var minpos = -1;
            var dmin = 256 * 256 * 256;
            var len = this.colorTab.length;
            for (var i = 0; i < len;) {
                var dr = r - (this.colorTab[i++] & 255);
                var dg = g - (this.colorTab[i++] & 255);
                var db = b - (this.colorTab[i++] & 255);
                var d = dr * dr + dg * dg + db * db;
                var pos = i / 3 - 1;
                if ((!used || this.usedEntry[pos]) && d < dmin) {
                    dmin = d;
                    minpos = pos
                }
            }
            return minpos
        };
        GIFEncoder.prototype.getPixels = function() {
            var w = this.width;
            var h = this.height;
            var image = this.image;
            if (w != image.width || h != image.height) {
                var temp = document.createElement("canvas");
                temp.width = w;
                temp.height = h;
                var ctx = temp.getContext("2d");
                ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, w, h);
                this.pixels = ctx.getImageData(0, 0, w, h).data
            }
        };
        GIFEncoder.prototype.writeGraphicCtrlExt = function() {
            this.out.writeByte(33);
            this.out.writeByte(249);
            this.out.writeByte(4);
            var transp, disp;
            if (this.transparent === null || this.has_alpha) {
                transp = 0;
                disp = 0
            } else {
                transp = 1;
                disp = 2
            }
            if (this.dispose >= 0) {
                disp = this.dispose & 7
            }
            disp <<= 2;
            this.out.writeByte(0 | disp | 0 | transp);
            this.writeShort(this.delay);
            this.out.writeByte(this.transIndex);
            this.out.writeByte(0)
        };
        GIFEncoder.prototype.writeImageDesc = function() {
            this.out.writeByte(44);
            this.writeShort(0);
            this.writeShort(0);
            this.writeShort(this.width);
            this.writeShort(this.height);
            if (this.firstFrame) {
                this.out.writeByte(0)
            } else {
                this.out.writeByte(128 | this.palSize)
            }
        };
        GIFEncoder.prototype.writeLSD = function() {
            this.writeShort(this.width);
            this.writeShort(this.height);
            this.out.writeByte(240 | this.palSize);
            this.out.writeByte(0);
            this.out.writeByte(0)
        };
        GIFEncoder.prototype.writeNetscapeExt = function() {
            this.out.writeByte(33);
            this.out.writeByte(255);
            this.out.writeByte(11);
            this.out.writeUTFBytes("NETSCAPE2.0");
            this.out.writeByte(3);
            this.out.writeByte(1);
            this.writeShort(this.repeat);
            this.out.writeByte(0)
        };
        GIFEncoder.prototype.writePalette = function() {
            this.out.writeBytes(this.colorTab);
            var n = 3 * 256 - this.colorTab.length;
            for (var i = 0; i < n; i++) this.out.writeByte(0)
        };
        GIFEncoder.prototype.writeShort = function(pValue) {
            this.out.writeByte(pValue & 255);
            this.out.writeByte(pValue >> 8 & 255)
        };
        GIFEncoder.prototype.writePixels = function() {
            var enc = new LZWEncoder(this.width, this.height, this.indexedPixels, this.colorDepth);
            enc.encode(this.out)
        };
        GIFEncoder.prototype.stream = function() {
            return this.out
        };
        module.exports = GIFEncoder
    }, {
        "./LZWEncoder.js": 2,
        "./TypedNeuQuant.js": 3
    }],
    2: [function(require, module, exports) {
        var a_radix = 256;
        var a_size = a_radix * 2;
        var a_count = a_size;
        var EOF = -1;
        var BITS = 12;
        var HSIZE = 5003;
        var masks = [0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535];

        function LZWEncoder(width, height, pixels, color_depth) {
            var init_bits = color_depth;
            var clear_code = 1 << color_depth;
            var eoi_code = clear_code + 1;
            var out_started = false;
            var hshift;
            var n_bits;
            var max_bits = BITS;
            var max_code;
            var max_max_code = 1 << BITS;
            var htab = [];
            var codetab = [];
            var cur_accum = 0;
            var cur_bits = 0;
            var free_ent = 0;
            var g_init_bits;
            var ClearCode;
            var EOFCode;

            function char_out(c, outs) {
                cur_accum &= masks[cur_bits];
                if (cur_bits > 0) cur_accum |= c << cur_bits;
                else cur_accum = c;
                cur_bits += n_bits;
                while (cur_bits >= 8) {
                    char_out_internal(cur_accum & 255, outs);
                    cur_accum >>= 8;
                    cur_bits -= 8
                }
                if (free_ent > max_code || ClearCode) {
                    if (ClearCode) {
                        g_init_bits = init_bits;
                        n_bits = g_init_bits;
                        max_code = 1 << n_bits
                    } else {
                        ++n_bits;
                        if (n_bits == max_bits) max_code = max_max_code;
                        else max_code = 1 << n_bits
                    }
                }
                if (c == EOFCode) {
                    while (cur_bits > 0) {
                        char_out_internal(cur_accum & 255, outs);
                        cur_accum >>= 8;
                        cur_bits -= 8
                    }
                    flush_char(outs)
                }
            }

            function char_out_internal(c, outs) {
                outs.writeByte(c)
            }

            function cl_block(outs) {
                cl_hash(HSIZE);
                free_ent = clear_code + 2;
                ClearCode = true;
                char_out(clear_code, outs)
            }

            function cl_hash(hsize) {
                for (var i = 0; i < hsize; ++i) htab[i] = -1
            }

            function compress(init_bits, outs) {
                var fcode;
                var i;
                var c;
                var ent;
                var disp;
                var hsize_reg;
                var hshift_reg;
                g_init_bits = init_bits;
                ClearCode = false;
                n_bits = g_init_bits;
                max_code = 1 << n_bits;
                clear_code = 1 << init_bits - 1;
                eoi_code = clear_code + 1;
                free_ent = clear_code + 2;
                cur_accum = 0;
                cur_bits = 0;
                var pix_len = pixels.length;
                var k = 0;
                var next_pixel = function() {
                    if (k < pix_len) {
                        return pixels[k++] & 255
                    } else {
                        return EOF
                    }
                };
                hshift = 0;
                for (fcode = HSIZE; fcode < 65536; fcode *= 2) {
                    ++hshift
                }
                hshift = 8 - hshift;
                hsize_reg = HSIZE;
                cl_hash(hsize_reg);
                EOFCode = eoi_code;
                char_out(clear_code, outs);
                ent = next_pixel();
                while ((c = next_pixel()) != EOF) {
                    fcode = (c << max_bits) + ent;
                    i = c << hshift ^ ent;
                    if (htab[i] == fcode) {
                        ent = codetab[i];
                        continue
                    } else if (htab[i] >= 0) {
                        disp = hsize_reg - i;
                        if (i === 0) disp = 1;
                        do {
                            if ((i -= disp) < 0) i += hsize_reg;
                            if (htab[i] == fcode) {
                                ent = codetab[i];
                                continue
                            }
                        } while (htab[i] >= 0)
                    }
                    char_out(ent, outs);
                    ent = c;
                    if (free_ent < max_max_code) {
                        codetab[i] = free_ent++;
                        htab[i] = fcode
                    } else cl_block(outs)
                }
                char_out(ent, outs);
                char_out(EOFCode, outs)
            }

            function encode(outs) {
                outs.writeByte(init_bits);
                var rem = width * height;
                outs.writeByte(rem & 255);
                compress(init_bits + 1, outs);
                outs.writeByte(0)
            }
            this.encode = encode
        }
        module.exports = LZWEncoder
    }, {}],
    3: [function(require, module, exports) {
        var ncycles = 100;
        var netsize = 256;
        var maxnetpos = netsize - 1;
        var netbiasshift = 4;
        var intbiasshift = 16;
        var intbias = 1 << intbiasshift;
        var gammashift = 10;
        var gamma = 1 << gammashift;
        var betashift = 10;
        var beta = intbias >> betashift;
        var betagamma = intbias << gammashift - betashift;
        var initrad = netsize >> 3;
        var radiusbiasshift = 6;
        var radiusbias = 1 << radiusbiasshift;
        var initradius = initrad * radiusbias;
        var radiusdec = 30;
        var alphabiasshift = 10;
        var initalpha = 1 << alphabiasshift;
        var alphadec;
        var radbiasshift = 8;
        var radbias = 1 << radbiasshift;
        var prime1 = 499;
        var prime2 = 491;
        var prime3 = 487;
        var prime4 = 503;
        var minpicturebytes = 3 * prime4;

        function NeuQuant(thepic, samplefac) {
            var network;
            var netindex;
            var bias;
            var freq;
            var radpower;

            function unbiasnet() {
                for (var i = 0; i < netsize; i++) {
                    network[i][0] >>= netbiasshift;
                    network[i][1] >>= netbiasshift;
                    network[i][2] >>= netbiasshift;
                    network[i][3] = i
                }
            }

            function alterneigh(rad, i, b, g, r) {
                var j, n, a, p;
                var lo = Math.abs(i - rad);
                var hi = Math.min(i + rad, netsize);
                j = i + 1;
                n = i - 1;
                a = 1;
                while (j < hi || n > lo) {
                    p = radpower[a++];
                    if (j < hi) {
                        try {
                            network[j][0] -= p * (network[j][0] - b) / alpharadbias;
                            network[j][1] -= p * (network[j][1] - g) / alpharadbias;
                            network[j++][2] -= p * (network[j][2] - r) / alpharadbias
                        } catch (e) {}
                    }
                    if (n > lo) {
                        try {
                            network[n][0] -= p * (network[n][0] - b) / alpharadbias;
                            network[n][1] -= p * (network[n][1] - g) / alpharadbias;
                            network[n--][2] -= p * (network[n][2] - r) / alpharadbias
                        } catch (e) {}
                    }
                }
            }

            function altersingle(alpha, i, b, g, r) {
                network[i][0] -= alpha * (network[i][0] - b) / initalpha;
                network[i][1] -= alpha * (network[i][1] - g) / initalpha;
                network[i][2] -= alpha * (network[i][2] - r) / initalpha
            }

            function contest(b, g, r) {
                var bestd = ~(1 << 31);
                var bestbiasd = bestd;
                var bestpos = -1;
                var bestbiaspos = bestpos;
                var i, n, dist, a, biasdist, betafreq;
                for (i = 0; i < netsize; i++) {
                    n = network[i];
                    dist = Math.abs(n[0] - b) + Math.abs(n[1] - g) + Math.abs(n[2] - r);
                    if (dist < bestd) {
                        bestd = dist;
                        bestpos = i
                    }
                    biasdist = dist - (bias[i] >> intbiasshift - netbiasshift);
                    if (biasdist < bestbiasd) {
                        bestbiasd = biasdist;
                        bestbiaspos = i
                    }
                    betafreq = freq[i] >> betashift;
                    freq[i] -= betafreq;
                    bias[i] += betafreq << gammashift
                }
                freq[bestpos] += beta;
                bias[bestpos] -= betagamma;
                return bestbiaspos
            }

            function inxbuild() {
                var i, j, p, q, smallpos, smallval, previouscol, startpos;
                previouscol = 0;
                startpos = 0;
                for (i = 0; i < netsize; i++) {
                    p = network[i];
                    smallpos = i;
                    smallval = p[1];
                    for (j = i + 1; j < netsize; j++) {
                        q = network[j];
                        if (q[1] < smallval) {
                            smallpos = j;
                            smallval = q[1]
                        }
                    }
                    q = network[smallpos];
                    if (i != smallpos) {
                        j = q[0];
                        q[0] = p[0];
                        p[0] = j;
                        j = q[1];
                        q[1] = p[1];
                        p[1] = j;
                        j = q[2];
                        q[2] = p[2];
                        p[2] = j;
                        j = q[3];
                        q[3] = p[3];
                        p[3] = j
                    }
                    if (smallval != previouscol) {
                        netindex[previouscol] = startpos << 2;
                        netindex[smallval] = startpos << 2;
                        startpos = i;
                        previouscol = smallval
                    }
                }
                netindex[previouscol] = startpos << 2;
                netindex[netsize - 1] = (netsize - 1) << 2
            }

            function inxsearch(b, g, r) {
                var a, p, dist;
                var bestd = 1e3;
                var best = -1;
                var i = netindex[g];
                var j = i + ((g - 1) * 4);
                while (i < netsize * 4 || j >= 0) {
                    if (i < netsize * 4) {
                        p = network[i >> 2];
                        dist = p[1] - g;
                        if (dist >= bestd) i = netsize * 4;
                        else {
                            i += 4;
                            if (dist < 0) dist = -dist;
                            a = p[0] - b;
                            if (a < 0) a = -a;
                            dist += a;
                            if (dist < bestd) {
                                a = p[2] - r;
                                if (a < 0) a = -a;
                                dist += a;
                                if (dist < bestd) {
                                    bestd = dist;
                                    best = p[3]
                                }
                            }
                        }
                    }
                    if (j >= 0) {
                        p = network[j >> 2];
                        dist = g - p[1];
                        if (dist >= bestd) j = -1;
                        else {
                            j -= 4;
                            if (dist < 0) dist = -dist;
                            a = p[0] - b;
                            if (a < 0) a = -a;
                            dist += a;
                            if (dist < bestd) {
                                a = p[2] - r;
                                if (a < 0) a = -a;
                                dist += a;
                                if (dist < bestd) {
                                    bestd = dist;
                                    best = p[3]
                                }
                            }
                        }
                    }
                }
                return best
            }

            function learn() {
                var i;
                var lengthcount = thepic.length;
                var alphadec = 30 + (samplefac - 1) / 3;
                var samplepixels = lengthcount / (3 * samplefac);
                var delta = ~~ (samplepixels / ncycles);
                var alpha = initalpha;
                var radius = initradius;
                var rad = radius >> radiusbiasshift;
                if (rad <= 1) rad = 0;
                radpower = new Int32Array(netsize);
                for (i = 0; i < rad; i++) radpower[i] = alpha * ((rad * rad - i * i) * radbias / (rad * rad));
                var step;
                if (lengthcount < minpicturebytes) {
                    samplefac = 1;
                    step = 3
                } else if (lengthcount % prime1 !== 0) {
                    step = 3 * prime1
                } else {
                    if (lengthcount % prime2 !== 0) step = 3 * prime2;
                    else {
                        if (lengthcount % prime3 !== 0) step = 3 * prime3;
                        else step = 3 * prime4
                    }
                }
                var b, g, r, j;
                var p = 0;
                i = 0;
                while (i < samplepixels) {
                    b = (thepic[p] & 255) << netbiasshift;
                    g = (thepic[p + 1] & 255) << netbiasshift;
                    r = (thepic[p + 2] & 255) << netbiasshift;
                    j = contest(b, g, r);
                    altersingle(alpha, j, b, g, r);
                    if (rad !== 0) alterneigh(rad, j, b, g, r);
                    p += step;
                    if (p >= lengthcount) p -= lengthcount;
                    i++;
                    if (delta === 0) delta = 1;
                    if (i % delta === 0) {
                        alpha -= alpha / alphadec;
                        radius -= radius / radiusdec;
                        rad = radius >> radiusbiasshift;
                        if (rad <= 1) rad = 0;
                        for (j = 0; j < rad; j++) radpower[j] = alpha * ((rad * rad - j * j) * radbias / (rad * rad))
                    }
                }
            }

this.map = function(b, g, r) {
    var bestd = 1e3;
    var best = -1;
    var i, j, p, dist;
    i = netindex[g];
    j = i - 4;
    while (i < netsize << 2 || j >= 0) {
        if (i < netsize << 2) {
            p = network[i >> 2];
            dist = p[1] - g;
            if (dist >= bestd) i = netsize << 2;
            else {
                i += 4;
                if (dist < 0) dist = -dist;
                var a = p[0] - b;
                if (a < 0) a = -a;
                dist += a;
                if (dist < bestd) {
                    a = p[2] - r;
                    if (a < 0) a = -a;
                    dist += a;
                    if (dist < bestd) {
                        bestd = dist;
                        best = p[3]
                    }
                }
            }
        }
        if (j >= 0) {
            p = network[j >> 2];
            dist = g - p[1];
            if (dist >= bestd) j = -4;
            else {
                j -= 4;
                if (dist < 0) dist = -dist;
                a = p[0] - b;
                if (a < 0) a = -a;
                dist += a;
                if (dist < bestd) {
                    a = p[2] - r;
                    if (a < 0) a = -a;
                    dist += a;
                    if (dist < bestd) {
                        bestd = dist;
                        best = p[3]
                    }
                }
            }
        }
    }
    return best
};
this.process = function() {
    learn();
    unbiasnet();
    inxbuild();
    return colormap()
};

function colormap() {
    var map = [];
    var index = [];
    for (var i = 0; i < netsize; i++) index[network[i][3]] = i;
    var k = 0;
    for (var l = 0; l < netsize; l++) {
        var j = index[l];
        map[k++] = network[j][0];
        map[k++] = network[j][1];
        map[k++] = network[j][2]
    }
    return map
}
network = new Array(netsize);
for (var i = 0; i < netsize; i++) {
    network[i] = new Array(4);
    var p = network[i];
    p[0] = p[1] = p[2] = (i << netbiasshift + 8) / netsize;
    freq[i] = intbias / netsize;
    bias[i] = 0
}
freq = [];
bias = [];
netindex = new Int32Array(256);
radpower = new Int32Array(netsize);
this. NeuQuant = NeuQuant
}
module.exports = NeuQuant
}, {}],
    4: [function(require, module, exports) {
        var GIFEncoder = require("./GIFEncoder.js");
        var renderFrame = function(frame) {
            var encoder = new GIFEncoder(frame.width, frame.height);
            if (frame.first) {
                encoder.setRepeat(frame.repeat);
                encoder.setDelay(frame.delay);
                encoder.setQuality(frame.quality)
            }
            encoder.setTransparent(frame.transparent);
            encoder.setDispose(frame.dispose);
            encoder.setProperties(frame.has_alpha, frame.first);
            encoder.addFrame(frame.data);
            if (frame.last) {
                encoder.finish()
            }
            if (frame.first) {
                var palette = encoder.colorTab;
                var color_table_size = palette.length;
                encoder.stream().pages.unshift(palette)
            }
            return encoder.stream()
        };
        var eventListener = function(e) {
            var frame = e.data;
            var stream = renderFrame(frame);
            postMessage({
                frame: frame,
                stream: stream
            })
        };
        addEventListener("message", eventListener)
    }, {
        "./GIFEncoder.js": 1
    }]
}, {}, [4]);