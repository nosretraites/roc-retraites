var lineApp = angular.module("app", ["chart.js", "ngMaterial", "ui.grid" , 'ngSanitize']);
function DialogCtrl($scope, $mdDialog){
    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.answer = function(answer) {
        $mdDialog.hide(answer);
    };
}
function LineCtrl($scope, $http, $q, $window, $mdDialog){

    // Configuration des 3 graphes

    $scope.charts = [];
    $scope.correspXAnnee = [];
    $scope.optionsG1 = {

        scaleStartValue: -4,
        scaleStepWidth: 1,
        scaleOverride: true,
        scaleSteps: 8,
        bezierCurve: false,
        multiTooltipTemplate: function(label) {
            return label.datasetLabel + " : " + label.value.toFixed(1).replace('.',',')+" %PIB";
        },
        scaleLabel: "<%=value%>%",

    };
    $scope.optionsG3 = {
        scaleStartValue: 22,
        scaleStepWidth: 2,
        scaleOverride: true,
         bezierCurve: false,
        scaleSteps: 8,
          multiTooltipTemplate: function(label) {
            return label.datasetLabel + " : " + label.value.toFixed(1).replace('.',',')+"%";
        },
         scaleLabel: "<%=value%>%"
    };

    $scope.optionsG2 = {
        scaleStartValue: 70,
        scaleStepWidth: 5,
        scaleOverride: true,
         bezierCurve: false,
        scaleSteps: 10,
          multiTooltipTemplate: function(label) {
            return label.datasetLabel + " : " + label.value.toFixed(1).replace('.',',')+"%";
        },
                 scaleLabel: "<%=value%>%"

    };

    angular.element(document).ready(function() {
        // Permet de changer l'apparence des slider

        angular.forEach(['AMDR-2015', 'TPG-2015', 'RAM-2015'], function(val, key) {
            angular.element(document.querySelector('#slider' + val + ' .md-slider-wrapper .md-thumb-container .md-disabled-thumb')).remove();
            angular.element(document.querySelector('#slider' + val + ' .md-slider-wrapper .md-thumb-container .md-thumb')).remove();
            var items = angular.element(document.querySelector('#slider' + val + '')).parent().parent().children();
            angular.element(items[1]).children().css('visibility', 'hidden');
            angular.element(items[3]).children().css('visibility', 'hidden');
        });

        // Permet de changer l'apparence des sliders.
        angular.forEach(angular.element(document.querySelectorAll('.cellSlider')), function(e1) {
            var slider = angular.element(e1).children().children();
            var container = angular.element(e1).children().children().children();
            angular.element(slider).append('<div class="rect"></div>');
        });

    });

    // Configuration des bornes mini et maxi des sliders.
    $scope.sliderConf = {};
    $scope.sliderConf.AMDR = {
        min: 58,
        max: 70
    };
    $scope.sliderConf.TPG = {
        min: 20,
        max: 40
    };
    $scope.sliderConf.RAM = {
        min: 30,
        max: 65
    };

    $scope.slideMove = {};
    $scope.slideMove.AMDR = {};
    $scope.slideMove.TPG = {};
    $scope.slideMove.RAM = {};

    $scope.arr = [];
    $scope.slideDiff = {};
    $scope.slideDiff.A = {};
    $scope.slideDiff.TPG = {};
    $scope.slideDiff.RAM = {};

    $scope.results = {};
    $scope.disp = {};
    // Situation financiere du système de retraite S[0] : legislatin inchangée , [1] avec les données input de l'utilisateur
    $scope.results.S = [];
    $scope.results.S[0] = [];
    $scope.results.S[1] = [];
    $scope.disp.S = [];
    $scope.updateDone = false;
    // Niveau de vie des retraités par rapport à l'ensemble de la population
    $scope.results.RNV = [];
    $scope.results.RNV[0] = [];
    $scope.results.RNV[1] = [];
    $scope.results.REV = [];
    $scope.disp.RNV = [];
    $scope.disp.REV = [];
    $scope.sliderAMDR = {};
    $scope.sliderTPG = {};
    $scope.sliderRAM = {};
    $scope.copyAMDR = {};
    $scope.copyTPG = {};
    $scope.copyRAM = {};


    $scope.disp.PS = [];

    $scope.labels = [];
    $scope.labelsS = [];
    $scope.labelsRNV = [];
    $scope.listeLines = ['REV', 'S', 'RNV'];
    $scope.series = ['Votre simulation', 'Législation inchangée'];
    $scope.iface = {};
    $scope.iface.scenario = "1";

    $scope.dateStart = "2018";
    $scope.dateStartInt = parseInt($scope.dateStart);
    $scope.dateEndInt = 2070;
    $scope.dateArchive = 2005;
    $scope.currentReportUrl = "http://www.cor-retraites.fr/simulateur/img/pdf/doc-4004.pdf";

    // Variable avec les scénarios utilisés
    $scope.iface.scenarios = [
        {"value":"1","label":{"salaire":"+ 1,8 %","chomage":"7 %"}},
        {"value":"2","label":{"salaire":"+ 1,5 %","chomage":"7 %"}},
        {"value":"3","label":{"salaire":"+ 1,3 %","chomage":"7 %"}},
        {"value":"4","label":{"salaire":"+ 1 %","chomage":"7 %"}},
        {"value":"5","label":{"salaire":"+ 1,8 %","chomage":"4,5 %"}},
        {"value":"6","label":{"salaire":"+ 1 %","chomage":"10 %"}}

      ];

    $scope.iface.anneesUi = [$scope.dateStart, '2020', '2025', '2030', '2035', '2040', '2045', '2050', '2055', '2060', '2065', '2070'];
    $scope.years = [$scope.dateStart, "2020", "2025", "2030", "2040", "2050", "2060","2070"];
    $scope.output = {
        S: {},
        RNV: {},
        REV: {}
    };

    // Les données d'initialisations sont dans ce fichier JSON
    var ajax1 = $http.get('fileProjection.json').success(function(response) {
        $scope.dataProj = response;
        $scope.initData = response;
    });

    $scope.parseDataJson = function() {
        var scenario = $scope.iface.scenario;
        angular.forEach($scope.dataProj.A[scenario], function(val, key) {

            if ($scope.isUsed(key, 'AMDR') !== true) {
                var round = Math.round(val * 10) / 10;
                $scope.sliderAMDR[key] = round;
                $scope.slideDiff.A[key] = {};
                $scope.slideDiff.A[key].val = parseFloat(val) - Math.floor(val * 10) / 10;
                $scope.slideDiff.A[key].sign = ((round > val) ? '+' : '-');
            } else {

                var min = $scope.sliderConf.AMDR.min;
                var max = $scope.sliderConf.AMDR.max;

                var round = Math.round(val * 10) / 10;
                var distMark = ((round - min) * 100) / (max - min);
                distMark = parseFloat(parseFloat(distMark).toFixed(1));
                angular.element(document.querySelector('#sliderAMDR-' + key + ' .rect')).css('left', distMark + '%');

            }

        });

        angular.forEach($scope.dataProj.T[scenario], function(val, key) {

            if ($scope.isUsed(key, 'TPG') !== true) {
                var round = Math.round(val * 1000) / 10;

                $scope.sliderTPG[key] = round;
                $scope.slideDiff.TPG[key] = {};
                $scope.slideDiff.TPG[key].val = parseFloat(val) - Math.floor(val * 1000) / 1000;

                $scope.slideDiff.TPG[key].sign = ((round > val * 100) ? '+' : '-');
            } else {

                var min = $scope.sliderConf.TPG.min;
                var max = $scope.sliderConf.TPG.max;

                var round = Math.round(val * 1000) / 10;
                var distMark = ((round - min) * 100) / (max - min);
                distMark = parseFloat(parseFloat(distMark).toFixed(1));

                angular.element(document.querySelector('#sliderTPG-' + key + ' .rect')).css('left', distMark + '%');

            }

        });

        angular.forEach($scope.dataProj.P[scenario], function(val, key) {

            if ($scope.isUsed(key, 'RAM') !== true) {
                var round = Math.round(val * 1000) / 10;

                $scope.sliderRAM[key] = round;
                $scope.slideDiff.RAM[key] = {};
                $scope.slideDiff.RAM[key].val = parseFloat(val) - Math.floor(val * 1000) / 1000;
                $scope.slideDiff.RAM[key].sign = ((round > val * 100) ? '+' : '-');
            } else {

                var min = $scope.sliderConf.RAM.min;
                var max = $scope.sliderConf.RAM.max;

                var round = Math.round(val * 1000) / 10;
                var distMark = ((round - min) * 100) / (max - min);
                distMark = parseFloat(parseFloat(distMark).toFixed(1));

                angular.element(document.querySelector('#sliderRAM-' + key + ' .rect')).css('left', distMark + '%');

            }

        });

        angular.element(document).ready(function() {

            angular.forEach(angular.element(document.querySelectorAll('.cellSlider')), function(e1) {
                var slider = angular.element(e1).children().children();

                var container = angular.element(e1).children().children().children();
                var con = angular.element(slider).children();
                if (!angular.element(slider).parent().hasClass('slideUsed')) {
                    angular.element(con[2]).css('left', angular.element(container[1]).css('left'));
                } else {

                }

            });

        });

    }

    $scope.changeScenario = function() {

        $scope.parseDataJson();
        $scope.calcul();
        $scope.refreshLabels();

    }

    $scope.refreshLabels = function() {
        $scope.labels = [];
        for (var f = $scope.dateArchive; f < $scope.dateStartInt; f++) {

                $scope.labels.push(f);

        }
        for (var x = $scope.iface.anneesUi[0]; x <= $scope.iface.anneesUi[$scope.iface.anneesUi.length - 1]; x++) {
            $scope.labels.push(parseInt(x));
            /*if ($scope.iface.anneesUi.indexOf(x.toString()) >= 0) {
                $scope.labels.push(parseInt(x));
            } else {
                $scope.labels.push('');
            } */
        }

    }

    $scope.convertDotToComma = function(){
        angular.element.cache=null;
          angular.forEach(angular.element(document.querySelectorAll('.md-thumb-text')), function(e1) {

                    e1.innerHTML = e1.innerHTML.replace('.',',');
              });
    }

    $scope.init = function() {

        $q.all([ajax1]).then(function() {

            // On set le slider avec l'age de départ à la retraite
            $scope.parseDataJson();

            $scope.calcul();

            $scope.refreshLabels();

        $scope.removeLoader();
        });

    };

    $scope.removeLoader = function(){
            var loader = angular.element(document.querySelector(".loader"));
            var main =  angular.element(document.querySelector(".main"));
            loader.remove();
            main.css('display','');
    }

    $scope.calculInchange = function(annee, slider) {
        $scope.used(annee, slider);
        $scope.calcul();

    }

    $scope.$on('create', function (event, chart) {

        if ($scope.correspXAnnee.length == 0 ) {

            for(var i in chart.datasets[0].points) {

                    $scope.correspXAnnee[chart.datasets[0].points[i].x]  = chart.datasets[0].points[i].label;
            }
        }

        for (var x in chart.scale.xLabels) {

            if ( (chart.scale.xLabels[x].toString()).charAt(3) != 0 && (chart.scale.xLabels[x].toString()).charAt(3) != 5 ){

                chart.scale.xLabels[x] = "";

            }

        }
        var year = 2005;
        for (var y in chart.datasets[0].points){
            chart.datasets[0].points[y].label = year;
            year ++;
        }

    });
    $scope.calcul = function() {

        var Ts = $scope.sliderTPG;
        var As = $scope.sliderAMDR;
        var Ps = $scope.sliderRAM;

        var scenario = $scope.iface.scenario;
        var deferred = $q.defer();
        var promise = deferred.promise;
        promise.then(function() {
            var dataProj = $scope.dataProj;
            var cpt = 0;

            $scope.disp.S[0] = [];
            $scope.disp.S[1] = [];

            $scope.disp.RNV[0] = [];
            $scope.disp.RNV[1] = [];
            $scope.disp.RNV[0] = [];
            $scope.disp.RNV[1] = [];
            $scope.disp.REV[0] = [];
            $scope.disp.REV[1] = [];

            $scope.disp.PS[0] = [];
            $scope.disp.PS[1] = [];

            $scope.yearIdx = {};

            for (var annee = $scope.dateArchive; annee <= $scope.dateEndInt; annee++) {
                var x = annee.toString();

                $scope.yearIdx[x] = cpt;

                var NR = parseFloat(parseFloat(dataProj.NR[scenario][x]).toFixed(8));
                var NC = parseFloat(parseFloat(dataProj.NC[scenario][x]).toFixed(8));
                var PDP = parseFloat(dataProj.PdP[scenario][x]);
                var T = parseFloat(dataProj.T[scenario][x] * 100);
                var G = parseFloat(dataProj.G[scenario][x]);
                var B = parseFloat(dataProj.B[scenario][x]);

                var P = parseFloat(dataProj.P[scenario][x]);
                var TCR = parseFloat(dataProj.TCR[scenario][x]);
                var TCS = parseFloat(dataProj.TCS[scenario][x]);
                var A = parseFloat($scope.dataProj.A[scenario][x]);
                var DP = parseFloat(dataProj.dP[scenario][x]);
                var CNV = parseFloat(dataProj.CNV[scenario][x]);

                var resS0 = parseFloat(B * (parseFloat(T / 100) - (NR / NC) * PDP));

                var AS = Number(As[x]);
                if ($scope.slideDiff.A[x].sign == "+") {
                    AS = Number(AS - 0.1) + Number($scope.slideDiff.A[x].val);
                } else {
                    AS += Number($scope.slideDiff.A[x].val);
                }

                var TS = Number(Ts[x]);
                if ($scope.slideDiff.TPG[x].sign == "+") {
                    TS = (Number(TS - 0.1).toFixed(1)) / 100 + Number($scope.slideDiff.TPG[x].val);
                } else {
                    TS = TS / 100 + Number($scope.slideDiff.TPG[x].val);
                }

                var PS = Number(Ps[x]);
                if ($scope.slideDiff.RAM[x].sign == "+") {
                    PS = (Number(PS - 0.1).toFixed(1)) / 100 + Number($scope.slideDiff.RAM[x].val);
                } else {
                    PS = PS / 100 + Number($scope.slideDiff.RAM[x].val);
                }

                //console.log(NR, NC, PDP, T, G, B, P, TCR, TCS, A, DP, CNV, resS0)
                var resS0 = parseFloat(B * (parseFloat(T / 100) - (NR / NC) * PDP));

                var resS1 = B * (TS - ((NR - G * (AS - A)) / (NC + 0.5 * G * (AS - A)) * (PS + DP)));

                // Calcul du rapport entre le niveau de vie des retraités et celui de l'ensemble de la population, simulation à partir des cibles fournies par l'utilisateur.
                var ps0 = P * ((1 - TCR) / (1 - TCS));
                var rnv0 = ps0 * CNV;  // A legislation inchangée

                var ps1 = PS * (1 - TCR) / (1 - (TCS + (TS - (T / 100))));
                var rnv1 = ps1 * CNV; //Avec vos cibles

                var ind = Math.round(Number(x) + Number(0.5) - A);

                // Calcul de la part de la durée de vie totale passée à la retraite
                var rev0 = (60 + dataProj.EV[scenario][Math.round(Number(x) + Number(0.5) - A)] - A) / (60 + dataProj.EV[scenario][Math.round(Number(x) + Number(0.5) - A)]);
                var rev1 = (60 + dataProj.EV[scenario][Math.round(Number(x) + Number(0.5) - AS)] - AS) / (60 + dataProj.EV[scenario][Math.round(Number(x) + Number(0.5) - AS)]);

                $scope.disp.PS[1][cpt] = ps0;
                $scope.disp.PS[0][cpt] = ps1;
                $scope.disp.S[1][cpt] = resS0 * 100;
                $scope.disp.S[0][cpt] = resS1 * 100;
                $scope.disp.RNV[1][cpt] = rnv0 * 100;
                $scope.disp.RNV[0][cpt] = rnv1 * 100;
                $scope.disp.REV[1][cpt] = parseFloat(rev0) * 100;
                $scope.disp.REV[0][cpt] = parseFloat(rev1) * 100;

                cpt++;

            }
        })
        deferred.resolve();
    }

    $scope.mailTo = function(){
        $window.location = "mailto:secretariat@cor-retraites.fr";
    }

    $scope.range = function(min, max, step) {
        step = step || 1;
        var input = [];
        for (var i = min; i <= max; i += step) input.push(i);
        return input;
    };
    $scope.getDate = function() {
        var date = new Date();
        return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    }

    $scope.historyBack = function() {

        window.location = 'http://www.cor-retraites.fr';
    }

    $scope.resetClass = function() {

        $scope.slideMove = {};
        $scope.slideMove.AMDR = {};
        $scope.slideMove.TPG = {};
        $scope.slideMove.RAM = {};

        angular.forEach(angular.element(document.querySelectorAll('.slideUsed')), function(e1) {

            angular.element(e1).removeClass('slideUsed');
        });

    }

    $scope.slideMoins = function(x, slider) {
        $scope.used(x, slider);
        if (slider == "AMDR") {
            var slider = $scope.sliderAMDR;
        } else if (slider == "TPG") {
            var slider = $scope.sliderTPG;
        } else if (slider == "RAM") {
            var slider = $scope.sliderRAM;
        }
        slider[x] = slider[x] - 0.1;

        $scope.calcul();
    }

    $scope.used = function(x, slider) {

        angular.element(document.querySelector('#slider' + slider + '-' + x + '')).addClass('slideUsed');

        $scope.slideMove[slider][x] = true;

    }

    $scope.isUsed = function(x, slider) {

        return $scope.slideMove[slider][x];

    }

    $scope.slidePlus = function(x, slider) {
        $scope.used(x, slider);
        if (slider == "AMDR") {
            var slider = $scope.sliderAMDR;
        } else if (slider == "TPG") {
            var slider = $scope.sliderTPG;
        } else if (slider == "RAM") {
            var slider = $scope.sliderRAM;
        }
        slider[x] = slider[x] + 0.1;

        $scope.calcul();

    }

    $scope.calculIntermediaire = function(index, x) {

        //Application de la formule

        return parseFloat(($scope.index[x].next.i[index] - x) / ($scope.index[x].next.i[index] - $scope.index[x].last.i[index]) * $scope.index[x].last.v[index] + (x - $scope.index[x].last.i[index] ) / ($scope.index[x].next.i[index]  - $scope.index[x].last.i[index]) * $scope.index[x].next.v[index]);

    }

    $scope.resetValues = function() {

        $scope.resetClass();
        $scope.parseDataJson();
        $scope.calcul();
    }

    $scope.share = function() {
        var fbLink = 'http://www.facebook.com/sharer.php?u=' + window.location.href + ' ';
        window.open(fbLink, '_blank');
    }

    $scope.tweet = function() {
        var twtLink = 'http://twitter.com/home?status=Simulez l’impact de réformes sur les finances du système de retraite et la situation des retraités http://goo.gl/j4Wbzy';
        window.open(twtLink, '_blank');

    }

    $scope.showAdvanced = function(ev) {
        $mdDialog.show({
                controller: DialogCtrl,
                scope: $scope,
                preserveScope: true,
                templateUrl: 'dialog1.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true
            })
            .then(function(answer) {
                $scope.status = 'You said the information was "' + answer + '".';
            }, function() {
                $scope.status = 'You cancelled the dialog.';
            });
    };

}
lineApp.config(['ChartJsProvider', function(ChartJsProvider) {

    // Configure all charts

    ChartJsProvider.setOptions({
        responsive: true,
        animation: false,
        pointDot: false,
        pointHitDetectionRadius : 1,
        tooltipXOffset: 10,
        colours: [{ // blue
            fillColor: 'rgba(0,0,0,0)',

            strokeColor: 'rgba(51,87,205,1)',
            pointColor: 'rgba(51,87,205,1)',
            pointStrokeColor: 'rgba(51,87,205,1)',
            pointHighlightFill: 'rgba(0,0,0,0)',
            datasetStroke: false,

            //Number - Tension of the bezier curve between points

        }, { // blue
            fillColor: 'rgba(0,0,0,0)',
            strokeColor: '#FB3333',
            pointColor: '#FB3333',
            pointStrokeColor: '#FB3333',
            pointHighlightFill: 'rgba(0,0,0,0)',
        }],
        maintainAspectRatio: false,
        showXLabels: 1,
        showTooltips: true,
        hideOverflow: true

    });

}]).filter('percentage', ['$filter', function($filter) {
    return function(input, decimals) {
        return ($filter('number')(input * 100, 1) + '%').replace(".",",");
    };
}]).filter('floatingAge', ['$filter', function($filter) {
    return function(input, decimals) {
        return ($filter('number')(input, 1) + ' ans').replace(".",",");
    };
}]).filter('floatingPercent', ['$filter', function($filter) {
    return function(input, decimals) {
        return ($filter('number')(input, 1) + ' %').replace(".",",");
    };
}]).filter('floatingAgeRecap', ['$filter', function($filter) {
    return function(input, decimals) {
        return ($filter('number')(input, 1) + '').replace(".",",");
    };
}]).filter('floatingPercentRecap', ['$filter', function($filter) {
    return function(input, decimals) {
        return ($filter('number')(input, 1) + '').replace(".",",");
    };
}]);
LineCtrl.$inject = ['$scope', '$http', '$q', '$window', '$mdDialog'];
DialogCtrl.$inject = ['$scope', '$mdDialog'];
lineApp.controller('LineCtrl', LineCtrl);

lineApp.directive('tabResult', function() {
    return {
        restrict: 'E',
        templateUrl: '/partials/tabResult.html',
        scope: {
            title: '=',
            data: '=',
            options: '=',
            labels: '=',
            series: '=',
            tooltip: '=',
            years: '=',
            idx: '=',
            coef: '='
        }
    };
});