function JavaColorClassGetRGB(r, g, b) {
    return ~parseInt([r, g, b].map(v => ("0" + (255 - v).toString(16)).slice(-2)).join(''), 16);
}
var DColor = (function () {
    function getRed(rgb) {
        return ((0xff0000 & rgb) >> 16) / 255;
    }

    function getGreen(rgb) {
        return ((0xff00 & rgb) >> 8) / 255;
    }

    function getBlue(rgb) {
        return (0xff & rgb) / 255;
    }

    function makeColorObj(rgb) {
        function r() {
            return rgb[0];
        }

        function g() {
            return rgb[1];
        }

        function b() {
            return rgb[2];
        }

        function color() {
            return rgb;
        }
        return {
            r: r,
            g: g,
            b: b,
            color: color
        };
    }

    function DColor1(rgb) {
        return makeColorObj([getRed(rgb), getGreen(rgb), getBlue(rgb)]);
    }

    function DColor3(r, g, b) {
        return makeColorObj([r, g, b]);
    }
    return {
        DColor1: DColor1,
        DColor3: DColor3
    }
})();
DColor.WHITE = DColor.DColor1(JavaColorClassGetRGB(255, 255, 255));
DColor.BLACK = DColor.DColor1(JavaColorClassGetRGB(0, 0, 0));
var ColorDifference = {};
// RGB表色系でのユークリッド距離による色差の計算
ColorDifference.SimpleColorDifference = (function () {
    var MAX = Math.sqrt(3);
    return {
        difference: function (src, dst) {
            var rd = src.r() - dst.r();
            var gd = src.g() - dst.g();
            var bd = src.b() - dst.b();
            return Math.sqrt(rd * rd + gd * gd + bd * bd) / MAX;
        }
    };
})();
// XYZ表色系でのユークリッド距離による色差の計算
ColorDifference.XYZDifference = (function () {
    var m = [
        [0.4124, 0.3576, 0.1805],
        [0.2126, 0.7152, 0.0722],
        [0.0193, 0.1192, 0.9505]
    ];
    var m11 = m[0][0],
        m12 = m[0][1],
        m13 = m[0][2];
    var m21 = m[1][0],
        m22 = m[1][1],
        m23 = m[1][2];
    var m31 = m[2][0],
        m32 = m[2][1],
        m33 = m[2][2];
    var d = m11 * m22 * m33 + m21 * m32 * m13 + m31 * m12 * m23 - m11 * m32 * m23 - m31 * m22 * m13 - m21 * m12 * m33;
    var mi = [
        [(m22 * m33 - m23 * m32) / d, (m13 * m32 - m12 * m33) / d, (m12 * m23 - m13 * m22) / d],
        [(m23 * m31 - m21 * m33) / d, (m11 * m33 - m13 * m31) / d, (m13 * m21 - m11 * m23) / d],
        [(m21 * m32 - m22 * m31) / d, (m12 * m31 - m11 * m32) / d, (m11 * m22 - m12 * m21) / d]
    ];
    var MAX = dif(DColor.WHITE, DColor.BLACK);

    function getX(r, g, b) {
        return m[0][0] * r + m[0][1] * g + m[0][2] * b;
    }

    function getY(r, g, b) {
        return m[1][0] * r + m[1][1] * g + m[1][2] * b;
    }

    function getZ(r, g, b) {
        return m[2][0] * r + m[2][1] * g + m[2][2] * b;
    }

    function getR(xyz) {
        return mi[0][0] * xyz[0] + mi[0][1] * xyz[1] + mi[0][2] * xyz[2];
    }

    function getG(xyz) {
        return mi[1][0] * xyz[0] + mi[1][1] * xyz[1] + mi[1][2] * xyz[2];
    }

    function getB(xyz) {
        return mi[2][0] * xyz[0] + mi[2][1] * xyz[1] + mi[2][2] * xyz[2];
    }

    function rgb2xyz(c) {
        return [
            getX(c.r(), c.g(), c.b()),
            getY(c.r(), c.g(), c.b()),
            getZ(c.r(), c.g(), c.b())
        ];
    }

    function xyz2rgb(xyz) {
        return DColor.DColor3(getR(xyz), getG(xyz), getB(xyz));
    }

    function difference(src, dst) {
        return dif(src, dst) / MAX;
    }

    function dif(src, dst) {
        var s = rgb2xyz(src);
        var d = rgb2xyz(dst);
        var xd = s[0] - d[0];
        var yd = s[1] - d[1];
        var zd = s[2] - d[2];
        return Math.sqrt(xd * xd + yd * yd + zd * zd);
    }
    return {
        difference: difference,
        rgb2xyz: rgb2xyz,
        xyz2rgb: xyz2rgb
    };
})();
// L*a*b*表色系でのユークリッド距離による色差の計算
ColorDifference.LabDifference = (function () {
    var t1 = Math.pow(6 / 29, 3);
    var d629 = 6 / 29;
    var d629_2 = d629 * d629;
    var d296 = 29 / 6 * 29 / 6;
    var d429 = 4 / 29;
    var d16116 = 16 / 116;
    var WP = ColorDifference.XYZDifference.rgb2xyz(DColor.WHITE);
    var MAX = dif(DColor.WHITE, DColor.BLACK);

    function xyz2lab(xyz) {
        var xxn = func(xyz[0] / WP[0]);
        var yyn = func(xyz[1] / WP[1]);
        var zzn = func(xyz[2] / WP[2]);
        return [
            116 * yyn - 16,
            500 * (xxn - yyn),
            200 * (yyn - zzn)
        ]
    }

    function lab2xyz(lab) {
        var l = lab[0];
        var a = lab[1];
        var b = lab[2];
        var fy = (l + 16) / 116;
        var fx = fy + a / 500;
        var fz = fy - b / 200;
        return [
            fx > d629 ? WP[0] * fx * fx * fx : (fx - d16116) * 3 * d629_2 * WP[0],
            fy > d629 ? WP[1] * fy * fy * fy : (fy - d16116) * 3 * d629_2 * WP[1],
            fx > d629 ? WP[2] * fz * fz * fz : (fz - d16116) * 3 * d629_2 * WP[2]
        ];
    }

    function func(t) {
        return t > t1 ? Math.pow(t, 1 / 3) : 1 / 3 * d296 * t + d429;
    }

    function rgb2lab(c) {
        return xyz2lab(ColorDifference.XYZDifference.rgb2xyz(c));
    }

    function lab2rgb(lab) {
        return ColorDifference.XYZDifference.xyz2rgb(lab2xyz(lab));
    }

    function difference(src, dst) {
        return dif(src, dst) / MAX;
    }

    function dif(src, dst) {
        var s = rgb2lab(src);
        var d = rgb2lab(dst);
        var xd = s[0] - d[0];
        var yd = s[1] - d[1];
        var zd = s[2] - d[2];
        return Math.sqrt(xd * xd + yd * yd + zd * zd);
    }
    return {
        difference: difference,
        rgb2lab: rgb2lab
    };
})();
// CIEDE2000による色差の計算
Math.toRadians = function (degree) {
    return degree * (Math.PI / 180);
}
ColorDifference.CIE2kDifference = (function () {
    var v25_7 = Math.pow(25, 7);
    var d6 = Math.toRadians(6);
    var d25 = Math.toRadians(25);
    var d30 = Math.toRadians(30);
    var d60 = Math.toRadians(60);
    var d63 = Math.toRadians(63);
    var d275 = Math.toRadians(275);
    var kl = 1;
    var kc = 1;
    var kh = 1;
    var MAX = dif(DColor.WHITE, DColor.BLACK);

    function difference(src, dst) {
        return dif(src, dst) / MAX;
    }

    function dif(src, dst) {
        var src_lab = ColorDifference.LabDifference.rgb2lab(src);
        var l1 = src_lab[0];
        var a1 = src_lab[1];
        var b1 = src_lab[2];
        var dst_lab = ColorDifference.LabDifference.rgb2lab(dst);
        var l2 = dst_lab[0];
        var a2 = dst_lab[1];
        var b2 = dst_lab[2];
        return dif2(l1, a1, b1, l2, a2, b2);
    }

    function dif2(l1, a1, b1, l2, a2, b2) {
        var dld = l2 - l1;
        var lb = (l1 + l2) / 2;
        var cs1 = Math.hypot(a1, b1);
        var cs2 = Math.hypot(a2, b2);
        var cb = (cs1 + cs2) / 2;
        var cb7 = Math.pow(cb, 7);
        var ad1 = a1 + a1 / 2 * (1 - Math.sqrt(cb7 / (cb7 + v25_7)));
        var ad2 = a2 + a2 / 2 * (1 - Math.sqrt(cb7 / (cb7 + v25_7)));
        var cd1 = Math.hypot(ad1, b1);
        var cd2 = Math.hypot(ad2, b2);
        var cbd = (cd1 + cd2) / 2;
        var cbd7 = Math.pow(cbd, 7);
        var dcd = (cd2 - cd1);
        var hd1 = b1 == 0 && ad1 == 0 ? 0 : Math.atan2(b1, ad1);
        if (hd1 < 0) {
            hd1 += Math.PI * 2;
        }
        var hd2 = b2 == 0 && ad2 == 0 ? 0 : Math.atan2(b2, ad2);
        if (hd2 < 0) {
            hd2 += Math.PI * 2;
        }
        var dhd = hd2 - hd1;
        if (cd1 * cd2 == 0) {
            dhd = 0;
        } else if (Math.abs(hd1 - hd2) > Math.PI) {
            if (hd2 <= hd1) {
                dhd += Math.PI * 2;
            } else {
                dhd -= Math.PI * 2;
            }
        }
        var dhhd = 2 * Math.sqrt(cd1 * cd2) * Math.sin(dhd / 2);
        var hhbd = 0;
        if (cd1 * cd2 != 0) {
            hhbd = Math.abs(hd1 - hd2) > Math.PI ? (hd1 + hd2 + Math.PI * 2) / 2 : (hd1 + hd2) / 2;
        }
        var tt = 1 - 0.17 * Math.cos(hhbd - d30) + 0.24 * Math.cos(2 * hhbd) + 0.32 * Math.cos(3 * hhbd + d6) - 0.20 * Math.cos(4 * hhbd - d63);
        var lb50_2 = Math.pow(lb - 50, 2);
        var ssl = 1 + (0.015 * lb50_2) / Math.sqrt(20 + lb50_2);
        var ssc = 1 + 0.045 * cbd;
        var ssh = 1 + 0.015 * cbd * tt;
        var rrt = -2 * Math.sqrt(cbd7 / (cbd7 + v25_7)) * Math.sin(d60 * Math.exp(-Math.pow((hhbd - d275) / d25, 2)));
        var de = Math.pow(dld / (kl * ssl), 2) + Math.pow(dcd / (kc * ssc), 2) + Math.pow(dhhd / (kh * ssh), 2) + rrt * (dcd / (kc * ssc)) * (dhhd / (kh * ssh));
        return Math.sqrt(de);
    }
    return {
        difference: difference
    };
})();

export function diffColor(rgb1, rgb2, _0to3){ // 0が最も高精度
    return ColorDifference[Object.keys(ColorDifference).reverse()[_0to3||0]].difference(
        DColor.DColor1(JavaColorClassGetRGB(rgb1[0], rgb1[1], rgb1[2])),
        DColor.DColor1(JavaColorClassGetRGB(rgb2[0], rgb2[1], rgb2[2]))
    );
}
