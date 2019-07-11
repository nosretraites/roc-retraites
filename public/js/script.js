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
    $scope.sliderConf.TRN = {
        min: 0,
        max: 100
    };

    $scope.slideMove = {};
    $scope.slideMove.AMDR = {};
    $scope.slideMove.TPG = {};
    $scope.slideMove.RAM = {};
    $scope.slideMove.TRN = {};

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
    $scope.sliderTRN = {};
    $scope.copyAMDR = {};
    $scope.copyTPG = {};
    $scope.copyRAM = {};


    $scope.disp.PS = [];
    $scope.disp.PN = [];
    $scope.disp.SN = [];
    $scope.disp.P = [];
    $scope.disp.T = [];

    $scope.labels = [];
    $scope.labelsS = [];
    $scope.labelsRNV = [];
    $scope.listeLines = ['REV', 'S', 'RNV'];
    $scope.series = ['Législation inchangée', 'Votre simulation'];
    $scope.iface = {};
    $scope.iface.scenario = "1";

    $scope.dateStart = "2018";
    $scope.dateStartInt = parseInt($scope.dateStart);
    $scope.dateEndInt = 2070;
    $scope.dateArchive = 2005;
    $scope.currentReportUrl = "http://www.cor-retraites.fr/simulateur/img/pdf/doc-4004.pdf";

    $scope.equilibrer = false;
    $scope.toggleE = function() {
        $scope.equilibrer = ! $scope.equilibrer;
        $scope.calcul();
    }

    // Variable avec les scénarios utilisés
    $scope.iface.scenarios = [
        {"value":"1","label":{"salaire":"+ 1,8 %","chomage":"7 %"}, salaire: 0.018},
        {"value":"2","label":{"salaire":"+ 1,5 %","chomage":"7 %"}, salaire: 0.015},
        {"value":"3","label":{"salaire":"+ 1,3 %","chomage":"7 %"}, salaire: 0.013},
        {"value":"4","label":{"salaire":"+ 1 %","chomage":"7 %"}, salaire: 0.01},
        {"value":"5","label":{"salaire":"+ 1,8 %","chomage":"4,5 %"}, salaire: 0.018},
        {"value":"6","label":{"salaire":"+ 1 %","chomage":"10 %"}, salaire: 0.01}

      ];

    $scope.iface.anneesUi = [$scope.dateStart, '2020', '2025', '2030', '2035', '2040', '2045', '2050', '2055', '2060', '2065', '2070'];
    $scope.years = [$scope.dateStart, "2020", "2025", "2030", "2040", "2050", "2060","2070"];
    $scope.output = {
        S: {},
        RNV: {},
        REV: {}
    };



    function prepareLabels(labels) {
        return labels.map(k => parseInt(k) % 5 == 0 ? k : '');
    }

    // Les données d'initialisations sont dans ce fichier JSON
    var ajax1 = $http.get('fileProjection.json').success(function(response) {
        $scope.dataProj = response;
        $scope.initData = response;

        $scope.inputMeta = {
            T: { name: 'Niveau des cotisations retraite' },
            P: { name: 'Niveau des pensions par rapport aux salaires' },
            A: { name: 'Âge auquel les personnes partent à la retraite' },
            B: { name: 'Part des revenus d’activité bruts dans le PIB' },
            NR: { name: 'Nombre de retraités de droit direct (tous régimes confondus)' },
            NC: { name: 'Nombre de personnes en emploi (ou nombre de cotisants)' },
            G: { name: 'Effectif moyen d’une génération arrivant aux âges de la retraite' },
            PdP: { name: 'Autres dépenses de retraite rapportées au nombre de retraités de droit direct, en % du revenu d’activité brut moyen' },
            dP: { name: 'Autres dépenses de retraite rapportées au nombre de retraités de droit direct, en % du revenu d’activité brut moyen 2' },
            TCR: { name: 'Taux des prélèvements sociaux sur les pensions de retraite' },
            TCS: { name: 'Taux des prélèvements sociaux sur les salaires et revenus d’activité' },
            CNV: { name: 'Coefficient pour passer du ratio « pension/salaire nets » au ratio des niveaux de vie' },
            EV: { name: 'Espérance de vie à 60 ans par génération' },
        }

        $scope.rawData = Object.keys($scope.inputMeta).reduce((v, k) => {
            v[k] = {
                name: $scope.inputMeta[k].name + ' (' + k + ')',
                data: $scope.iface.scenarios.map(s => {
                    return Object.values($scope.dataProj[k][s.value])
                }),
                labels: prepareLabels(Object.keys($scope.dataProj[k][1])),
                series: $scope.iface.scenarios.map(s => 'salaire '+ s.label.salaire + ', chomage ' + s.label.chomage)
            }
            return v;
        }, {})
    });

    $scope.parseDataJson = function() {
        var scenario = $scope.iface.scenario;
        angular.forEach($scope.dataProj.A[scenario], function(val, key) {
            var round = Math.round(val * 10) / 10;

            if ($scope.years.indexOf(key) < 0) {
                return
            }

            if ($scope.isUsed(key, 'AMDR') !== true) {
                $scope.sliderAMDR[key] = round;
            } else {
                var min = $scope.sliderConf.AMDR.min;
                var max = $scope.sliderConf.AMDR.max;

                var distMark = ((round - min) * 100) / (max - min);
                distMark = parseFloat(parseFloat(distMark).toFixed(1));
                angular.element(document.querySelector('#sliderAMDR-' + key + ' .rect')).css('left', distMark + '%');
            }
        });

        angular.forEach($scope.dataProj.T[scenario], function(val, key) {
            var round = Math.round(val * 1000) / 10;

            if ($scope.years.indexOf(key) < 0) {
                return
            }

            if ($scope.isUsed(key, 'TPG') !== true) {
                $scope.sliderTPG[key] = round;
            } else {
                var min = $scope.sliderConf.TPG.min;
                var max = $scope.sliderConf.TPG.max;

                var distMark = ((round - min) * 100) / (max - min);
                distMark = parseFloat(parseFloat(distMark).toFixed(1));

                angular.element(document.querySelector('#sliderTPG-' + key + ' .rect')).css('left', distMark + '%');
            }
        });

        angular.forEach($scope.dataProj.P[scenario], function(val, key) {
            var round = Math.round(val * 1000) / 10;

            if ($scope.years.indexOf(key) < 0) {
                return
            }

            if ($scope.isUsed(key, 'RAM') !== true) {
                $scope.sliderRAM[key] = round;
            } else {
                var min = $scope.sliderConf.RAM.min;
                var max = $scope.sliderConf.RAM.max;

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

        console.log('h')
        $scope.sliderTRN[0] = 61.0

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

    $scope.calcul = function() {
        var scenario = $scope.iface.scenario;
        var meta = $scope.iface.scenarios.find(function(s) { return s.value === scenario})
        var years = [0].concat($scope.years)
        var allyears = d3.range($scope.dateArchive, $scope.dateEndInt + 1);
        var growth = d3.scaleLinear(allyears, allyears.reduce(function(accum) {
            accum.push(accum[accum.length-1] * (1 + meta.salaire))
            return accum;
        }, [1]));

        var TsScale = d3.scaleLinear(years, [0].concat(Object.keys($scope.sliderTPG).map(function(k) { return $scope.sliderTPG[k]/100 - $scope.dataProj.T[scenario][k] })))
        var AsScale = d3.scaleLinear(years, [0].concat(Object.keys($scope.sliderAMDR).map(function(k) { return $scope.sliderAMDR[k] - $scope.dataProj.A[scenario][k] })))
        var PsScale = d3.scaleLinear(years, [0].concat(Object.keys($scope.sliderRAM).map(function(k) { return $scope.sliderRAM[k]/100 - $scope.dataProj.P[scenario][k] })))
        var Ts = function(key) {
            return (TsScale(key) + $scope.dataProj.T[scenario][key])
        }
        var As = function(key) {
            return (AsScale(key) + $scope.dataProj.A[scenario][key])
        }
        var Ps = function(key) {
            return (PsScale(key) + $scope.dataProj.P[scenario][key])
        }

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
            $scope.disp.PN[0] = [];
            $scope.disp.PN[1] = [];
            $scope.disp.SN[0] = [];
            $scope.disp.SN[1] = [];

            $scope.disp.P[0] = [];
            $scope.disp.P[1] = [];
            $scope.disp.T[0] = [];
            $scope.disp.T[1] = [];

            $scope.yearIdx = {};

            for (var annee = $scope.dateArchive; annee <= $scope.dateEndInt; annee++) {
                var x = annee.toString();

                $scope.yearIdx[x] = cpt;

                var NR = parseFloat(parseFloat(dataProj.NR[scenario][x]).toFixed(8));
                var NC = parseFloat(parseFloat(dataProj.NC[scenario][x]).toFixed(8));
                var PDP = parseFloat(dataProj.PdP[scenario][x]);
                var T = parseFloat(dataProj.T[scenario][x]);
                var G = parseFloat(dataProj.G[scenario][x]);
                var B = parseFloat(dataProj.B[scenario][x]);

                var P = parseFloat(dataProj.P[scenario][x]);
                var TCR = parseFloat(dataProj.TCR[scenario][x]);
                var TCS = parseFloat(dataProj.TCS[scenario][x]);
                var A = parseFloat($scope.dataProj.A[scenario][x]);
                var DP = parseFloat(dataProj.dP[scenario][x]);
                var CNV = parseFloat(dataProj.CNV[scenario][x]);

                var resS0 = parseFloat(B * (T - (NR / NC) * PDP));

                var AS = As(x);
                var TS = Ts(x);
                var PS = Ps(x);

                var nb = ((NR - G * (AS - A)) / (NC + 0.5 * G * (AS - A)));
                if ($scope.equilibrer) {
                    var resSE = resS0;
                    var TRN = $scope.sliderTRN[0]/100.0;
                    PS = TRN * (1 - TCS + T - resSE/B - nb*DP) / (1 - TCR + TRN*nb)
                    TS = resSE/B + nb*(PS + DP)
                }

                var resS1 = B * (TS - nb * (PS + DP));

                // Calcul du rapport entre le niveau de vie des retraités et celui de l'ensemble de la population, simulation à partir des cibles fournies par l'utilisateur.
                var sn0 = (1 - TCS);
                var rn0 = P * (1 - TCR);
                var ps0 = rn0 / sn0;
                var rnv0 = ps0 * CNV;  // A legislation inchangée

                var sn1 = 1 - (TCS + (TS - T));
                var rn1 = PS * (1 - TCR);
                var ps1 =  rn1 / sn1;
                var rnv1 = ps1 * CNV; //Avec vos cibles

                var ind = Math.round(Number(x) + Number(0.5) - A);

                // Calcul de la part de la durée de vie totale passée à la retraite
                var rev0 = (60 + dataProj.EV[scenario][Math.round(Number(x) + Number(0.5) - A)] - A) / (60 + dataProj.EV[scenario][Math.round(Number(x) + Number(0.5) - A)]);
                var rev1 = (60 + dataProj.EV[scenario][Math.round(Number(x) + Number(0.5) - AS)] - AS) / (60 + dataProj.EV[scenario][Math.round(Number(x) + Number(0.5) - AS)]);

                $scope.disp.PS[0][cpt] = ps0;
                $scope.disp.PS[1][cpt] = ps1;

                var gr = growth(x);

                $scope.disp.PN[0][cpt] = gr * rn0;
                $scope.disp.PN[1][cpt] = gr * rn1;

                $scope.disp.SN[0][cpt] = gr * sn0;
                $scope.disp.SN[1][cpt] = gr * sn1;

                $scope.disp.P[0][cpt] = P;
                $scope.disp.P[1][cpt] = PS;

                $scope.disp.T[0][cpt] = T;
                $scope.disp.T[1][cpt] = TS;

                $scope.disp.S[0][cpt] = resS0;
                $scope.disp.S[1][cpt] = resS1;
                $scope.disp.RNV[0][cpt] = rnv0;
                $scope.disp.RNV[1][cpt] = rnv1;
                $scope.disp.REV[0][cpt] = parseFloat(rev0);
                $scope.disp.REV[1][cpt] = parseFloat(rev1);

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
        $scope.slideMove.TRN = {};

        angular.forEach(angular.element(document.querySelectorAll('.slideUsed')), function(e1) {

            angular.element(e1).removeClass('slideUsed');
        });

    }

    $scope.slideMoins = function(x, slider) {
        $scope.used(x, slider);
        var slider = $scope['slider' + slider];
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

    $scope.slidePlus = function(x, sliderName) {
        $scope.used(x, sliderName);
        var slider = $scope['slider' + sliderName];
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
    ChartJsProvider.setOptions({
        responsive: true,
        animation: false,
        scaleSteps: 5,
        pointDot: false,
        tooltipXOffset: 10,
        maintainAspectRatio: true,
        showTooltips: true
    });
}]);

LineCtrl.$inject = ['$scope', '$http', '$q', '$window', '$mdDialog'];
DialogCtrl.$inject = ['$scope', '$mdDialog'];
lineApp.controller('LineCtrl', LineCtrl);

lineApp.directive('tabResult', function() {


    var xs = d3.range(2000,2070)

    var trace1 = {
      x: xs,
      y: xs.map(_ => Math.random()),
      type: 'scatter',
      name: 'One 1'
    };

    var trace2 = {
      x: xs,
      y: xs.map(_ => Math.random()),
      type: 'scatter',
      name: 'Two 2'
    };

    var data = [trace1, trace2];

    return {
        restrict: 'E',
        templateUrl: 'partials/tabResult.html',
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
        },
        link: function(scope, element, attributes, ctrl) {
            //console.log(element)
            /*Plotly.newPlot(element[0], data, { responsive: true});

            console.log('here');//var abtesting = ABTestingService.getEnvironment();
            scope.$watch('title', function(v) {
                console.log(v);
            })//*/
        }
    };
});
